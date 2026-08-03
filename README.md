# @streemkit/forge

Plug-and-play admin panel framework for Deno. Declare your resources — Forge generates the complete
SSR back-office: lists, detail views, forms, relations, RBAC. Built on Hono + Inertia + Vue. Deno
Deploy ready.

```bash
deno add jsr:@streemkit/forge
```

> **Status:** pre-release. JSR publication is in preparation — for now, clone or vendor this
> repository and use the `forge/engine` / `forge/admin` import aliases (they will become
> `@streemkit/forge/engine` / `@streemkit/forge`).

---

## Features

- **Declarative resources** — `defineResource(…)` and the full CRUD exists: search, faceted filters,
  sorting, pagination, `belongsTo` / `hasMany` relations (with scoped creation), soft-delete,
  business hooks.
- **Batteries-included facade** — `forge(options)` wires Hono, Inertia (`@streemkit/inertia-deno`),
  the CRUD router, static assets and a CSRF guard with sane defaults. Every part stays overridable.
- **Agnostic engine** — data (`ForgeAdapter` contract, Postgres built-in), auth (`permissions`),
  rendering: everything is injected. The engine depends on Hono only, and works headless without the
  Vue kit.
- **End-to-end RBAC** — per-resource policies, per-field permissions locked in the form _and_
  rejected server-side, permission-filtered navigation.
- **Vue kit** — 3 CRUD pages, composables, UI primitives, registrable custom displays/inputs,
  injected layout, native i18n (fr/en).
- **Deno Deploy ready** — production mode serves built assets, no runtime disk writes, lazy Postgres
  pool from a `DATABASE_URL`.

## Quick start

**1. Declare a resource** — importing the file registers it:

```ts
// resources/products.ts
import { badge, defineResource, text } from "@streemkit/forge/engine"

export default defineResource({
  name: "products", // URL slug → /admin/products
  table: "products", // your SQL table (your migrations)
  label: "Products",
  policy: "catalog", // RBAC: catalog.read / catalog.write
  search: ["name", "sku"],
  nav: { group: "Catalog", icon: "package", order: 1 },
  fields: [
    text("name", { editable: true, required: true, searchable: true }),
    text("sku", { editable: true, searchable: true }),
    badge("status", {
      editable: true,
      options: [
        { value: "draft", label: "Draft", tone: "muted" },
        { value: "active", label: "Active", tone: "success" },
      ],
    }),
  ],
})
```

**2. Mount the server:**

```ts
// main.ts
import { forge } from "@streemkit/forge"
import "./resources/products.ts"

const admin = forge({
  db: Deno.env.get("DATABASE_URL")!, // Postgres URL | { query } | ForgeAdapter
  permissions: (c) => getPermissions(c), // or "open" in dev
  title: "My back-office",
  home: "/admin/products",
})

// Your business routes live next to it, on the same Hono:
admin.app.get("/api/health", (c) => c.json({ ok: true }))

Deno.serve(admin.fetch)
```

`GET /admin/products`, `/admin/products/:id`, `/create`, `/:id/edit` and all mutations now exist —
validated, permission-checked, CSRF-guarded.

**3. Wire the frontend** — an Inertia entry resolving the kit's pages and injecting your layout. See
the [Getting started guide](docs/en/guide/getting-started.md).

## Architecture

```
engine/   CRUD engine (Deno/Hono) — agnostic, everything injected (ForgeContext)
          resource.ts field.ts page.ts router.ts brand.ts adapter.ts
          adapters/postgres.ts  +  mod.ts (public API)
admin/    batteries-included facade: forge(options)
ui/       Vue kit — CRUD pages, composables, primitives, i18n (no server code)
dev/      example app: PGlite + demo resources + Vite HMR — the living spec
docs/     documentation site (VitePress, en/fr)
```

One-way dependency graph: `dev → admin + ui`, `admin → engine`, `ui → engine
(constants only)`,
`engine → Hono`. The engine is usable standalone (headless); the facade is the nominal entry point.

## Documentation

Full guide (en/fr) in [`docs/`](docs/):

```bash
deno task docs         # dev server (HMR)
deno task docs:build   # static build → docs/.vitepress/dist
deno task docs:serve   # serves the build (Deno Deploy ready)
```

## Development

The `dev/` folder is a complete example app consuming Forge through its public API only — PGlite
(in-memory Postgres), demo resources, a custom dashboard, business endpoints:

```bash
deno task install   # frontend deps (once)
deno task dev       # mock backend + Vite HMR
deno task test      # engine + facade tests
```

See the [roadmap](ROADMAP.md) for what's next (built-in auth & RBAC storage, more fields, additional
adapters, JSR publication).

## License

MIT
