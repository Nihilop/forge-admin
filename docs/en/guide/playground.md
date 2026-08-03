# Example app (playground)

The repository's `dev/` folder is a **complete little Deno app** consuming
Forge exactly like an external dev would — through the public API only. It
doubles as a **DX demo**, a **living spec** and a **dev harness** (Vite HMR on
the `ui/` kit).

::: tip Demo credentials
The example app uses the real [built-in auth](auth): sign in with
**admin@forge.dev / forge-dev** (seeded at boot — PGlite is in-memory,
everything is recreated on each start). The **Administration** menu (Admins,
Roles & permissions) and the Logout button (an outlet extension) appear once
signed in.
:::

## Run

```bash
deno task install   # frontend deps (once)
deno task dev       # Vite HMR (frontend) + Deno backend
deno task serve     # PROD variant: serves the built dist (deno task build first)
```

- **HMR**: edit the kit (`ui/*.vue`) → instant reload.
- The **engine** (`engine/`, server) needs a restart (no HMR).
- `ADMIN_PREFIX=/back deno task serve` → tests a custom prefix end to end.

No database to install: the DB is **PGlite** (a real Postgres compiled to
WASM, in memory), created and seeded on first access. The engine generates real
Postgres SQL — PGlite executes it as-is.

## What the app demonstrates

| Feature | Where to look |
|---|---|
| Full CRUD (search, filters, sorting, pagination) | `dev/resources/products.ts` · `orders.ts` |
| `belongsTo` + `hasMany` with scoped creation | `orders.product`; product detail → "Orders" section |
| Conditional business action wired to an app endpoint | "Publish" action + `POST /products/:id/publish` (`dev/server.ts`) |
| Custom page (dashboard, stat tiles, filtered deep-links) | `definePage` + `dev/src/pages/Dashboard.vue` |
| JSON API coexisting with the admin | `GET /api/stats` |
| Unified menu + custom icons | `dev/src/DevLayout.vue` + `registerNavIcon` (`main.ts`) |
| Built-in auth (login, sessions, Administration menu, dynamic roles) | `auth: { seed }` (`server.ts`) |
| [OTP/2FA extension](otp) + elevation | `otpServer()` (`server.ts`) · `otpUi()` (`src/main.ts`) · "sensitive action" demo on the dashboard |
| The `forge()` facade in real conditions | all of `dev/server.ts` (~60 lines) |

## Adding a demo resource

1. Declare it in `dev/resources/` (see [Resources](resources)).
2. Create the table + a few rows in the seed (`dev/db.ts`).
3. Import it in `dev/server.ts`: `import "./resources/my-resource.ts"`.

It shows up in the sidebar with its full CRUD, under HMR.

## Structure

```
dev/
  server.ts         the app: forge() + business routes + dashboard
  db.ts             embedded PGlite + demo tables/data
  resources/        the app's resources (products, orders…)
  src/
    main.ts         Inertia entry (dual resolver + i18n + layout + icons)
    pages/          the app's custom pages (Dashboard.vue)
    DevLayout.vue   the app's sidebar (Forge nav + language switcher)
```
