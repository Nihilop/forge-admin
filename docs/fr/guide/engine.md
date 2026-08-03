# Moteur nu & adapters

Sous la [façade](facade) il y a un moteur **agnostique** : `createForgeRouter`
ne dépend que de Hono — données, auth, rendu et redirections sont **injectés**
via le `ForgeContext`. Ce chapitre est pour les hôtes qui assemblent eux-mêmes,
et pour écrire un **adapter** vers un autre stockage.

## Le `ForgeContext`

```ts
import { createForgeRouter, postgresAdapter } from "forge/engine"

const router = createForgeRouter({
  adapter: postgresAdapter({ query: (sql, params) => db.query(sql, params) }),
  permissions: (c) => getPermissions(c),
  render: (c, page, props) => inertia.render(c, page, props),
  renderErrors: (c, page, props, errors) => inertia.renderWithErrors(c, page, props, errors),
  redirect: (to) => redirectResponse(to),
  sameOrigin: (c) => isSameOrigin(c),
  prefix: "/admin",
})

app.route("/admin", router)   // la MÊME valeur que `prefix`
```

| Champ | Rôle |
|---|---|
| `adapter` | Couche données (contrat `ForgeAdapter`). Postgres fourni. |
| `query` | Sucre : exécuteur SQL Postgres, enveloppé automatiquement dans `postgresAdapter`. Ignoré si `adapter` est fourni. |
| `permissions(c)` | Permissions effectives de l'opérateur (`null` = anonyme → `/login`). |
| `render(c, page, props)` | Rend une page. Le moteur nomme ses pages `forge/ResourceIndex\|Show\|Form` et **injecte `prefix` dans les props**. |
| `renderErrors(…, errors)` | Rend avec erreurs de validation (clés de champs + `_form`). |
| `redirect(to)` | Réponse de redirection (303 recommandé pour Inertia). |
| `sameOrigin(c)?` | Garde anti-CSRF des mutations (optionnelle mais recommandée). |
| `prefix?` | Préfixe de montage. Défaut `/admin`. |

Le rendu étant injecté, le moteur peut fonctionner **sans le kit Vue** :
servez du HTML maison, du JSON, ce que vous voulez — c'est le mode headless.

## Le contrat `ForgeAdapter`

Le routeur ne parle **aucun dialecte de stockage** : il exprime des intentions,
l'adapter les traduit. Postgres est l'implémentation de référence
(`postgresAdapter({ query })` — le *driver* reste à vous : PGlite, postgres.js,
Neon…).

| Méthode | Intention |
|---|---|
| `count(def, where)` | Nombre de lignes (pagination). `where` = `{ q?, filters? }`, déjà validé par le routeur. |
| `list(def, select)` | Lignes projetées, triées, paginées. `select` ajoute `fields`, `sort?`, `limit`, `offset`. |
| `get(def, id)` | Une ligne projetée sur tous les champs (`null` si absente ou soft-supprimée). |
| `getRaw(def, id)` | La ligne **brute**, sans projection ni filtre soft-delete (état pour les hooks). |
| `children(child, foreignKey, parentId, fields)` | Enfants d'une relation `hasMany`. |
| `relationOptions(target, labelField)` | Options d'un `belongsTo` éditable (`{value,label}`, borné, trié). |
| `create(def, values)` | Insère ; renvoie l'id créé (`null` si inconnu). `values` est indexé par **colonne d'écriture**. |
| `update(def, id, values)` | Met à jour (jamais appelé avec `values` vide). |
| `delete(def, id)` | Supprime — **soft** si `def.softDelete`. |

Invariants à respecter :

- Les **valeurs** (recherche, filtres, corps de formulaire) arrivent déjà
  validées/whitelistées — mais passez-les **toujours** en paramètres liés,
  jamais dans la chaîne de requête.
- Les projections `belongsTo` renvoient `{ id, label }` sous la clé du champ.
- `column` / `writeColumn` / `orderBy` des defs sont des expressions **de
  votre stockage** : du SQL pour un adapter SQL, un chemin de document pour du
  NoSQL. C'est l'adapter qui les interprète — une resource qui n'en utilise
  pas est portable telle quelle.

## Écrire un adapter

Squelette minimal (stockage en mémoire, pour l'idée) :

```ts
import type { ForgeAdapter, Row } from "forge/engine"

export function memoryAdapter(tables: Record<string, Row[]>): ForgeAdapter {
  const rows = (t: string) => tables[t] ?? []
  return {
    count: (def, w) => Promise.resolve(applyWhere(rows(def.table), def, w).length),
    list: (def, s) =>
      Promise.resolve(
        applyWhere(rows(def.table), def, s)
          .slice(s.offset, s.offset + s.limit)
          .map((r) => project(r, s.fields)),
      ),
    get: (def, id) => Promise.resolve(rows(def.table).find((r) => String(r.id) === id) ?? null),
    getRaw: (def, id) => Promise.resolve(rows(def.table).find((r) => String(r.id) === id) ?? null),
    children: (child, fk, parentId) =>
      Promise.resolve(rows(child.table).filter((r) => String(r[fk]) === parentId)),
    relationOptions: (target, labelField) =>
      Promise.resolve(rows(target.table).map((r) => ({
        value: String(r.id),
        label: String(r[labelField]),
      }))),
    create: (def, values) => {
      const id = String(rows(def.table).length + 1)
      rows(def.table).push({ id, ...values })
      return Promise.resolve(id)
    },
    update: (def, id, values) => {
      Object.assign(rows(def.table).find((r) => String(r.id) === id) ?? {}, values)
      return Promise.resolve()
    },
    delete: (def, id) => {
      const t = rows(def.table)
      t.splice(t.findIndex((r) => String(r.id) === id), 1)
      return Promise.resolve()
    },
  }
}
```

Branchez-le via `forge({ db: memoryAdapter(seed) })` ou
`createForgeRouter({ adapter })`. Les tests de l'adapter Postgres
(`engine/adapters/postgres_test.ts`) montrent le comportement attendu de
chaque méthode — c'est la meilleure spec pour écrire le vôtre.
