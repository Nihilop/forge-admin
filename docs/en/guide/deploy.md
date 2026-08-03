# Deploying

A Forge app deploys like any Deno app: one process serving `admin.fetch`,
**built frontend assets** served statically, a Postgres URL in an environment
variable. No disk writes at runtime — **Deno Deploy** compatible.

## 1. Build the frontend

```bash
deno task build     # inertia-deno-cli build → dist/
```

The Vite build produces `dist/` (hashed JS/CSS + manifest). In production mode
the facade serves `/assets/*` from that folder — **no Vite at runtime**.

## 2. Switch to production mode

```ts
const admin = forge({
  db: Deno.env.get("DATABASE_URL")!,
  permissions: (c) => resolvePermissions(c),   // NEVER "open" in production
  // prod: true — or let the PROD_MODE=1 env variable trigger it
})
Deno.serve(admin.fetch)
```

```bash
PROD_MODE=1 deno run -A main.ts   # local test of the build
```

## 3. Deno Deploy

```bash
deployctl deploy --project=my-admin --entrypoint=main.ts
```

- **`DATABASE_URL`**: set it in the Deploy project's env variables (Neon,
  Supabase… — the built-in pool is lazy, cold starts don't pay for a
  connection).
- **`PROD_MODE=1`**: same, in the Deploy env vars.
- Include `dist/` in the deployment (it is served statically).

::: warning Production checklist
- `permissions`: a real resolver — `"open"` is a dev mode (it warns at boot,
  but you are the one deploying).
- Session cookie: `Secure` + `SameSite` (Forge's CSRF guard is defense **in
  addition**, not instead).
- `prefix`: the same value everywhere if you customize it (option + mount).
:::

## Usual environment variables

| Variable | Role |
|---|---|
| `DATABASE_URL` | Postgres URL (when `db:` is a string). |
| `PROD_MODE=1` | Enables the facade's production mode (static assets). |
| `PORT` | The `Deno.serve` port (if you read it in your `main.ts`). |

## The docs site

The docs site (VitePress) deploys the same way, as pure static:

```bash
deno task docs:build
deployctl deploy --project=my-docs --entrypoint=docs/serve.ts
```
