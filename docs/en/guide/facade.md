# The `forge()` facade

`forge(options)` is the **batteries-included** mode: it wires Hono, Inertia
(`deno-inertia`), the CRUD router, assets and the CSRF guard with defaults
everywhere. Every part stays replaceable. To assemble things yourself, see
[Bare engine & adapters](engine).

```ts
import { forge } from "forge/admin"
import "./resources/products.ts"

const admin = forge({
  db: Deno.env.get("DATABASE_URL")!,
  permissions: (c) => resolvePermissions(c),
  prefix: "/admin",
  title: "My back-office",
  home: "/admin/products",
})

admin.app.get("/api/health", (c) => c.json({ ok: true }))  // your routes

Deno.serve(admin.fetch)
```

## The options

| Option | Default | Role |
|---|---|---|
| `db` | — | **Required.** Postgres URL, `{ query }`, or a `ForgeAdapter` — see below. |
| `permissions` | — | **Required.** `"open"` (dev), a static list, or a resolver — see [Permissions](permissions). |
| `prefix` | `/admin` | CRUD mount prefix. Every generated URL derives from it. |
| `entry` | `src/main.ts` | Vite frontend entry. |
| `title` / `lang` | `Admin` / `en` | The `<title>` and `lang` attribute of the default HTML template. |
| `template` | — | Full HTML template `(page, assets) => string` (replaces `title`/`lang`). |
| `shared` | — | Extra shared Inertia props, merged on top of `forge.nav` + `prefix`. |
| `version` | `1.0.0` | Inertia assets version. |
| `prod` | env `PROD_MODE === "1"` | Production mode: serves built assets statically. |
| `dist` | `dist` | Built assets directory. |
| `home` | — | Redirects `/` to this path. Without it, `/` stays yours. |
| `app` | new `Hono` | Mount on an existing Hono. |
| `context` | — | **Escape hatch**: `Partial<ForgeContext>` applied last — overrides any wired part (render, redirect, sameOrigin, adapter…). |

## What `forge()` returns

| Field | Role |
|---|---|
| `app` | The assembled Hono — add your business routes to it. |
| `fetch` | The handler for `Deno.serve(admin.fetch)`. |
| `render(c, page, props?)` | Renders one of **your** Inertia pages from a Hono route. |
| `inertia` | The Inertia instance (low-level access). |
| `prefix` | The effective prefix — handy to build URLs (`${admin.prefix}/orders`). |

## The `db` option in detail

```ts
// 1. A Postgres URL → built-in driver (@db/postgres), LAZY pool:
//    no connection before the first query.
forge({ db: "postgres://user:pass@host:5432/app", /* … */ })

// 2. A SQL executor → you pick the driver (PGlite, postgres.js, Neon…).
forge({ db: { query: (sql, params) => pglite.query(sql, params) }, /* … */ })

// 3. A full ForgeAdapter → another store (see Bare engine & adapters).
forge({ db: myMongoAdapter, /* … */ })
```

## The provided defaults

- **CSRF guard**: same-origin check on every mutation (`Sec-Fetch-Site`, then
  `Origin` comparison; header-less requests — curl, scripts — pass through).
  Override: `context.sameOrigin`.
- **Shared props**: every page (CRUD **and** custom) receives `forge.nav` (the
  unified menu) and `prefix` — your layout and `useForgePrefix()` consume them.
- **Assets**: in production, `/assets/*` serves the Vite build from `dist` — no
  Vite process at runtime, Deno Deploy compatible.
- **HTML template**: minimal and clean; pass `template` for your own (fonts,
  analytics, meta…).

## Overriding a part

`context` is applied **after** the defaults — it always wins:

```ts
forge({
  db, permissions,
  context: {
    // Example: disable the CSRF guard behind an internal proxy
    sameOrigin: () => true,
    // Example: plug a custom renderer instead of Inertia
    // render: (c, page, props) => myRender(c, page, props),
  },
})
```
