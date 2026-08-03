# Prise en main

Un back-office complet en trois fichiers : une **resource**, un **serveur**, une
**entrée front**. Comptez cinq minutes.

::: info Statut
Forge sera publié sous **`@streemkit/forge`** (publication JSR en cours de
préparation). En attendant, il se consomme via les alias d'import
`forge/engine` et `forge/admin` (clone ou vendoring du dépôt) — les exemples
de ce guide sont écrits avec ces alias, qui deviendront
`@streemkit/forge/engine` et `@streemkit/forge`.
:::

## Prérequis

- **Deno 2+**
- Une base **Postgres** (Neon, Supabase, locale…) — ou rien du tout : le
  [playground](playground) embarque PGlite, un Postgres en mémoire.

## 1. Déclarer une resource

Une resource décrit un modèle (une table). L'**import suffit** à l'enregistrer.

```ts
// resources/users.ts
import { badge, date, defineResource, email, text } from "forge/engine"

export default defineResource({
  name: "users",          // slug d'URL  → /admin/users
  table: "users",         // table SQL (elle doit exister — vos migrations)
  label: "Utilisateurs",
  policy: "users",        // RBAC : users.read / users.write
  search: ["name", "email"],
  nav: { group: "Équipe", icon: "users", order: 1 },
  fields: [
    text("name", { label: "Nom", editable: true, required: true, searchable: true }),
    email("email", { editable: true, searchable: true }),
    badge("role", {
      label: "Rôle",
      editable: true,
      options: [
        { value: "admin", label: "Admin", tone: "primary" },
        { value: "member", label: "Membre", tone: "muted" },
      ],
    }),
    date("created_at", {
      label: "Créé le",
      column: "(EXTRACT(EPOCH FROM created_at) * 1000)::float8",
    }),
  ],
})
```

## 2. Monter le serveur

La façade [`forge()`](facade) assemble Hono, Inertia, le routeur CRUD, les
assets et l'anti-CSRF — avec des défauts partout.

```ts
// main.ts
import { forge } from "forge/admin"
import "./resources/users.ts"        // side-effect : enregistre la resource

const admin = forge({
  db: Deno.env.get("DATABASE_URL")!, // URL Postgres | { query } | ForgeAdapter
  permissions: "open",               // DEV UNIQUEMENT — voir /fr/guide/permissions
  title: "Mon back-office",
  lang: "fr",
  home: "/admin/users",              // "/" redirige vers la liste
})

// Vos routes métier vivent à côté, sur le même Hono :
admin.app.get("/api/health", (c) => c.json({ ok: true }))

Deno.serve(admin.fetch)
```

C'est tout côté serveur. Les routes suivantes existent immédiatement :

| Route | Page |
|---|---|
| `GET /admin/users` | Liste — recherche, filtres, tri, pagination |
| `GET /admin/users/:id` | Fiche — détail + relations |
| `GET /admin/users/create` · `/:id/edit` | Formulaires |
| `POST …` | Mutations — validation, RBAC, anti-CSRF |

## 3. Brancher le front

Le moteur rend des pages Inertia nommées `forge/ResourceIndex|Show|Form`. Votre
entrée les résout depuis le kit et injecte votre layout :

```ts
// src/main.ts
import { createApp, h } from "vue"
import { createInertiaApp } from "@inertiajs/vue3"
import { createForgeI18n } from "@/i18n"
import { FORGE_PAGE_NS } from "@/brand"

createInertiaApp({
  resolve: (name) => {
    const isForge = name.startsWith(`${FORGE_PAGE_NS}/`)
    const pages = isForge
      ? import.meta.glob("../forge/ui/pages/**/*.vue", { eager: true })
      : import.meta.glob("./pages/**/*.vue", { eager: true })
    const file = isForge ? name.slice(FORGE_PAGE_NS.length + 1) : name
    const key = Object.keys(pages).find((k) => k.endsWith(`/pages/${file}.vue`))
    if (!key) throw new Error(`Page introuvable : "${name}"`)
    return pages[key] as object
  },
  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .use(createForgeI18n({ locale: "fr" }))
      .mount(el)
  },
})
```

Et les **styles** : une ligne. Le kit fournit sa feuille tout-en-un (Tailwind,
design system light/dark, polices) — le build Vite de VOTRE projet génère le
CSS final (pas d'asset précompilé, purge et tokens partagés avec vos pages) :

```css
/* src/style.css — importé par votre main.ts */
@import "@streemkit/forge/ui/styles/forge.css";
```

Sans layout injecté, le **shell par défaut** du kit s'applique : sidebar
générée depuis vos resources, thème clair/sombre, sélecteur de langue —
clé en main. Pour votre propre chrome : `provide(FORGE_LAYOUT, MonLayout)`.
Le détail (shell, extensions, thème, composants custom) est dans
[Kit frontend](frontend).

## 4. Lancer

Le dev et le build passent par `inertia-deno-cli` (Vite HMR côté front) :

```json
// deno.json (tasks)
{
  "tasks": {
    "dev": "deno run -A jsr:@streemkit/inertia-deno-cli dev",
    "build": "deno run -A jsr:@streemkit/inertia-deno-cli build",
    "serve": "PROD_MODE=1 deno run -A main.ts"
  }
}
```

```bash
deno task dev     # http://localhost:8083/admin/users
```

## La suite

- [Resources](resources) — toutes les options : relations, actions, hooks.
- [Permissions](permissions) — remplacer `"open"` par un vrai RBAC.
- [Pages custom](pages) — un dashboard à côté du CRUD.
- [Déployer](deploy) — build + Deno Deploy.
