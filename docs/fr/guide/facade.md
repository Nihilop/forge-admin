# La façade `forge()`

`forge(options)` est le mode **batteries incluses** : elle assemble Hono,
Inertia (`deno-inertia`), le routeur CRUD, les assets et l'anti-CSRF avec des
défauts partout. Chaque brique reste remplaçable. Pour assembler vous-même,
voir [Moteur nu & adapters](engine).

```ts
import { forge } from "forge/admin"
import "./resources/products.ts"

const admin = forge({
  db: Deno.env.get("DATABASE_URL")!,
  permissions: (c) => resolvePermissions(c),
  prefix: "/admin",
  title: "Mon back-office",
  lang: "fr",
  home: "/admin/products",
})

admin.app.get("/api/health", (c) => c.json({ ok: true }))  // vos routes

Deno.serve(admin.fetch)
```

## Les options

| Option | Défaut | Rôle |
|---|---|---|
| `db` | — | **Requis.** URL Postgres, `{ query }`, ou `ForgeAdapter` — voir plus bas. |
| `permissions` | — | **Requis** (sauf si `auth` est actif). `"open"` (dev), liste statique, ou résolveur — voir [Permissions](permissions). |
| `auth` | — | Auth builtin : `true` ou `AuthOptions` (seed, sessions, rôles). Fournit le résolveur de permissions — voir [Authentification](auth). |
| `prefix` | `/admin` | Préfixe de montage du CRUD. Toutes les URLs générées en dérivent. |
| `entry` | `src/main.ts` | Entrée front Vite. |
| `title` / `lang` | `Admin` / `en` | Le `<title>` et l'attribut `lang` du template HTML par défaut. |
| `template` | — | Template HTML complet `(page, assets) => string` (remplace `title`/`lang`). |
| `shared` | — | Props partagées Inertia supplémentaires, fusionnées au-dessus de `forge.nav` + `prefix`. |
| `version` | `1.0.0` | Version des assets Inertia. |
| `prod` | env `PROD_MODE === "1"` | Mode prod : sert les assets buildés statiquement. |
| `dist` | `dist` | Dossier des assets buildés. |
| `home` | — | Redirige `/` vers ce chemin. Sans elle, `/` reste à vous. |
| `app` | nouveau `Hono` | Monte sur un Hono existant. |
| `extensions` | — | Extensions **serveur** (`{ name, install(admin) }[]`) : installées une fois l'app assemblée — routes, resources, pages d'une feature optionnelle (2FA…). Pendant front : `installForgeExtensions` du kit ([Kit frontend](frontend)). |
| `context` | — | **Escape hatch** : `Partial<ForgeContext>` appliqué en dernier — surcharge n'importe quelle brique (render, redirect, sameOrigin, adapter…). |

## Ce que retourne `forge()`

| Champ | Rôle |
|---|---|
| `app` | Le Hono assemblé — ajoutez vos routes métier dessus. |
| `fetch` | Le handler pour `Deno.serve(admin.fetch)`. |
| `render(c, page, props?)` | Rend une de **vos** pages Inertia depuis une route Hono. |
| `inertia` | L'instance Inertia (accès bas niveau). |
| `prefix` | Le préfixe effectif — pratique pour construire des URLs (`${admin.prefix}/orders`). |

## L'option `db` en détail

```ts
// 1. Une URL Postgres → driver intégré (@db/postgres), pool PARESSEUX :
//    aucune connexion avant la première requête.
forge({ db: "postgres://user:pass@host:5432/app", /* … */ })

// 2. Un exécuteur SQL → vous choisissez le driver (PGlite, postgres.js, Neon…).
forge({ db: { query: (sql, params) => pglite.query(sql, params) }, /* … */ })

// 3. Un ForgeAdapter complet → autre stockage (voir Moteur nu & adapters).
forge({ db: monAdapterMongo, /* … */ })
```

## Les défauts fournis

- **Anti-CSRF** : garde same-origin sur toutes les mutations
  (`Sec-Fetch-Site`, puis comparaison d'`Origin` ; requêtes sans en-tête —
  curl, scripts — laissées passer). Surcharge : `context.sameOrigin`.
- **Props partagées** : chaque page (CRUD **et** custom) reçoit `forge.nav`
  (le menu unifié) et `prefix` — votre layout et `useForgePrefix()` s'en
  servent.
- **Assets** : en prod, `/assets/*` sert le build Vite depuis `dist` — aucun
  process Vite au runtime, compatible Deno Deploy.
- **Template HTML** : minimal et propre ; passez `template` pour le vôtre
  (fonts, analytics, meta…).

## Surcharger une brique

`context` est appliqué **après** les défauts — il gagne toujours :

```ts
forge({
  db, permissions,
  context: {
    // Exemple : désactiver la garde CSRF derrière un proxy interne
    sameOrigin: () => true,
    // Exemple : brancher un rendu custom à la place d'Inertia
    // render: (c, page, props) => myRender(c, page, props),
  },
})
```
