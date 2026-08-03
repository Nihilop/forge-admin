# Getting started

A complete back-office in three files: a **resource**, a **server**, a
**frontend entry**. Allow five minutes.

::: info Status
Forge will be published as **`@streemkit/forge`** (JSR publication in
preparation). For now it is consumed through the `forge/engine` and
`forge/admin` import aliases (clone or vendor the repository) — the examples
in this guide use those aliases, which will become `@streemkit/forge/engine`
and `@streemkit/forge`.
:::

## Prerequisites

- **Deno 2+**
- A **Postgres** database (Neon, Supabase, local…) — or nothing at all: the
  [example app](playground) embeds PGlite, an in-memory Postgres.

## 1. Declare a resource

A resource describes a model (a table). **Importing it is enough** to register it.

```ts
// resources/users.ts
import { badge, date, defineResource, email, text } from "forge/engine"

export default defineResource({
  name: "users",          // URL slug  → /admin/users
  table: "users",         // SQL table (it must exist — your migrations)
  label: "Users",
  policy: "users",        // RBAC: users.read / users.write
  search: ["name", "email"],
  nav: { group: "Team", icon: "users", order: 1 },
  fields: [
    text("name", { label: "Name", editable: true, required: true, searchable: true }),
    email("email", { editable: true, searchable: true }),
    badge("role", {
      label: "Role",
      editable: true,
      options: [
        { value: "admin", label: "Admin", tone: "primary" },
        { value: "member", label: "Member", tone: "muted" },
      ],
    }),
    date("created_at", {
      label: "Created",
      column: "(EXTRACT(EPOCH FROM created_at) * 1000)::float8",
    }),
  ],
})
```

## 2. Mount the server

The [`forge()`](facade) facade wires Hono, Inertia, the CRUD router, assets and
the CSRF guard — with defaults everywhere.

```ts
// main.ts
import { forge } from "forge/admin"
import "./resources/users.ts"        // side-effect: registers the resource

const admin = forge({
  db: Deno.env.get("DATABASE_URL")!, // Postgres URL | { query } | ForgeAdapter
  permissions: "open",               // DEV ONLY — see /guide/permissions
  title: "My back-office",
  home: "/admin/users",              // "/" redirects to the list
})

// Your business routes live right next to it, on the same Hono:
admin.app.get("/api/health", (c) => c.json({ ok: true }))

Deno.serve(admin.fetch)
```

That's it server-side. These routes now exist:

| Route | Page |
|---|---|
| `GET /admin/users` | List — search, filters, sorting, pagination |
| `GET /admin/users/:id` | Detail — fields + relations |
| `GET /admin/users/create` · `/:id/edit` | Forms |
| `POST …` | Mutations — validation, RBAC, CSRF guard |

## 3. Wire the frontend

The engine renders Inertia pages named `forge/ResourceIndex|Show|Form`. Your
entry resolves them from the kit and injects your layout:

```ts
// src/main.ts
import { createApp, h } from "vue"
import { createInertiaApp } from "@inertiajs/vue3"
import { FORGE_LAYOUT } from "@/layout"
import { createForgeI18n } from "@/i18n"
import { FORGE_PAGE_NS } from "@/brand"
import MyLayout from "./MyLayout.vue"

createInertiaApp({
  resolve: (name) => {
    const isForge = name.startsWith(`${FORGE_PAGE_NS}/`)
    const pages = isForge
      ? import.meta.glob("../forge/ui/pages/**/*.vue", { eager: true })
      : import.meta.glob("./pages/**/*.vue", { eager: true })
    const file = isForge ? name.slice(FORGE_PAGE_NS.length + 1) : name
    const key = Object.keys(pages).find((k) => k.endsWith(`/pages/${file}.vue`))
    if (!key) throw new Error(`Page not found: "${name}"`)
    return pages[key] as object
  },
  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .use(createForgeI18n({ locale: "en" }))
      .provide(FORGE_LAYOUT, MyLayout)   // your sidebar/header
      .mount(el)
  },
})
```

Details (layout, i18n, custom components) live in [Frontend kit](frontend).

## 4. Run

Dev and build go through `inertia-deno-cli` (Vite HMR on the frontend):

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

## Next steps

- [Resources](resources) — every option: relations, actions, hooks.
- [Permissions](permissions) — replace `"open"` with real RBAC.
- [Custom pages](pages) — a dashboard next to the CRUD.
- [Deploying](deploy) — build + Deno Deploy.
