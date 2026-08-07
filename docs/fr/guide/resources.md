# Resources

Une **resource** décrit un modèle (une table) ; Forge en génère tout le CRUD.
On la déclare avec `defineResource` — l'import du fichier suffit à
l'enregistrer (side-effect), aucune étape d'« enregistrement » séparée.

```ts
import { defineResource, text } from "forge/engine"

export default defineResource({
  name: "products",
  table: "products",
  label: "Produits",
  policy: "catalog",
  fields: [text("name", { editable: true, required: true })],
})
```

::: warning La table doit exister
Forge ne crée **jamais** de table métier : `table` référence une table gérée
par **vos** migrations. Le moteur lit et écrit dedans, c'est tout.
:::

## Toutes les options

| Option | Type | Rôle |
|---|---|---|
| `name` | `string` | Slug d'URL (`<prefix>/:name`). |
| `table` | `string` | Table SQL (ou collection, selon l'[adapter](engine)). |
| `label` | `string` | Libellé affiché. |
| `policy` | `string` | **Obligatoire.** Base RBAC : `${policy}.read` / `.write`. Une resource sans policy lève à l'enregistrement. |
| `search` | `string[]` | Clés cherchables (plein-texte, ILIKE côté Postgres). |
| `orderBy` | `string` | Tri par défaut (expression du stockage, code-defined). Défaut : `"id" DESC`. |
| `create` / `delete` | `boolean` | Active création / suppression. Défaut : `true`. |
| `softDelete` | `string` | Colonne de soft-delete — le DELETE devient un `UPDATE … = now()` et les lignes supprimées sont masquées partout. |
| `nav` | `{ group, label?, icon?, order? }` | Présence + place dans la sidebar. Sans `nav`, la resource existe mais n'apparaît pas au menu. |
| `hasMany` | `HasManyDef[]` | Relations enfants affichées sur la fiche. |
| `tabs` | `boolean` | Sections `hasMany` en onglets (sinon empilées). |
| `actions` | `ActionDef[]` | Boutons custom sur la **fiche**. |
| `listActions` | `ActionDef[]` | Boutons custom sur la **liste** (import, export…). |
| `hooks` | voir plus bas | Logique métier post-mutation. |
| `fields` | `Field[]` | Les champs — voir [Champs](fields). |

## Relations `hasMany`

Affiche les enfants sur la fiche du parent, avec création scopée en option :

```ts
defineResource({
  name: "products",
  // …
  hasMany: [
    {
      key: "orders",             // id de la section
      label: "Commandes",
      resource: "orders",        // une AUTRE resource déclarée
      foreignKey: "product_id",  // la FK sur l'enfant
      columns: ["customer", "qty", "status"],  // clés de champs de l'enfant
      create: true,              // bouton « Nouveau » → FK pré-remplie
    },
  ],
  tabs: true,                    // sections en onglets
})
```

Ce que fait le moteur :

- La section n'apparaît que si l'opérateur a la permission `read` de la
  resource **enfant** (RBAC en profondeur).
- `create: true` ajoute un bouton « Nouveau » qui ouvre le formulaire enfant
  **scopé** : la FK est injectée côté serveur (et uniquement si la relation la
  whiteliste — impossible de forger une colonne arbitraire), le champ disparaît
  du formulaire, une bannière rappelle le parent.
- Les lignes sont cliquables vers la fiche de l'enfant.

## Actions custom

Des boutons branchés sur **vos** endpoints. Forge rend le bouton (permission +
visibilité conditionnelle) et fait le POST ; la route est à vous.

```ts
actions: [
  {
    key: "publish",
    label: "Publier",
    icon: "rocket",
    confirm: "Publier ce produit ?",
    visibleWhen: { field: "status", equals: "draft" }, // selon la ligne
    href: "/products/:id/publish",   // VOTRE endpoint (`:id` est résolu)
    data: { source: "admin" },       // corps du POST (optionnel)
  },
]
```

```ts
// Votre endpoint, sur le même Hono :
admin.app.post("/products/:id/publish", async (c) => {
  const id = c.req.param("id")
  await query(`UPDATE products SET status = 'active' WHERE id = $1`, [id])
  return redirect(`${admin.prefix}/products/${id}`)
})
```

| Option | Rôle |
|---|---|
| `key` / `label` / `icon` | Identité du bouton (`icon` : nom résolu côté front, voir [Kit frontend](frontend)). |
| `href` | URL cible. `:id` remplacé par l'id de la ligne. |
| `link` | `true` → **navigue** (GET) au lieu de POSTer (ex. ouvrir un form custom). |
| `confirm` | Confirmation avant tir. |
| `permission` | Permission requise. Défaut : `${policy}.write`. |
| `visibleWhen` | `{ field, equals? , notEquals? }` — visibilité selon la ligne (fiche uniquement). |
| `variant` | Style du bouton (`default`, `outline`, `ghost`, `destructive`, `secondary`). |

`listActions` : même forme, affichées sur la **liste**, sans `:id` ni
`visibleWhen`.

## Sélection multiple : bulk actions & suppression groupée

La liste offre une **sélection multiple** (checkboxes) dès qu'une action
groupée est possible. Deux briques :

- **Suppression groupée** — fournie d'office (sauf `delete: false`) : la barre
  de sélection propose « Supprimer », avec confirmation, permission `.write`
  et hooks `afterDelete` par ligne.
- **`bulkActions`** — vos actions métier sur la sélection. Même forme que
  `listActions` ; le kit POSTe `{ ids: string[], …data }` sur `href` (un
  endpoint de **votre** app), puis recharge la liste :

```ts
bulkActions: [
  {
    key: "activate",
    label: "Marquer actif",
    icon: "rocket",
    confirm: "Marquer les produits sélectionnés comme actifs ?",
    href: "/products/bulk/activate",
  },
],
```

```ts
admin.app.post("/products/bulk/activate", async (c) => {
  const { ids } = await c.req.json() as { ids: string[] }
  for (const id of ids) await query(`UPDATE products SET status = 'active' WHERE id = $1`, [id])
  return redirect(`${admin.prefix}/products`)
})
```

## Export CSV

Chaque liste s'exporte en un clic (bouton dédié de la barre d'outils) : le
fichier reprend **exactement la vue courante** — recherche, filtres facettés
et tri — sans pagination (plafonné à 10 000 lignes). Colonnes = champs
visibles en liste, les `belongsTo` exportent leur libellé, encodage UTF-8
avec BOM (Excel-ready). L'endpoint est `GET <prefix>/<resource>/export`
(permission `.read`).

## Hooks métier

Invoqués **après** une mutation réussie — le moteur ne sait rien de votre
métier, il notifie :

```ts
hooks: {
  afterCreate: async ({ id }) => { await indexRecord(id) },
  afterUpdate: async ({ id, changed }) => {
    // `changed` = clés des champs dont la valeur a changé
    if (changed.includes("status")) await notifyStatusChange(id)
  },
  afterDelete: async ({ id, row }) => {
    // `row` = la ligne COMPLÈTE avant suppression (colonnes non déclarées incluses)
    await cleanupFiles(row)
  },
}
```

## Recettes

**Resource en lecture seule** (historique, logs…) :

```ts
defineResource({
  name: "audit-logs",
  table: "audit_logs",
  label: "Audit",
  policy: "audit",
  create: false,
  delete: false,
  fields: [/* aucun champ `editable` */],
})
```

**Resource sans menu** — omettez `nav` : elle reste accessible par URL et
utilisable comme cible de `hasMany`, mais n'encombre pas la sidebar.

**Soft-delete** :

```ts
defineResource({ /* … */, softDelete: "deleted_at" })
```

Le bouton « Supprimer » renseigne `deleted_at` ; listes, fiches, options de
relation et sections `hasMany` masquent automatiquement les lignes supprimées.
