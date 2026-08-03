# Authentication

The **built-in** auth module ships the whole foundation: admins, roles,
sessions, login page — stored in your database, in `forge_`-prefixed tables.
It activates through the [facade](facade), and when it is active the
`permissions` option becomes **optional**: the module provides the resolver,
wired to the stored sessions and roles.

```ts
const admin = forge({
  db: Deno.env.get("DATABASE_URL")!,
  auth: {
    seed: {
      email: Deno.env.get("FORGE_ADMIN_EMAIL")!,
      password: Deno.env.get("FORGE_ADMIN_PASSWORD")!,
    },
  },
  title: "My back-office",
})
```

`auth: true` works too (every option has a default) — but without `seed`
you'll need another way to create the first admin (see below).

## The options (`AuthOptions`)

| Option | Default | Role |
|---|---|---|
| `seed` | — | `{ email, password, name? }` — creates the **first** admin at boot if no admin exists. |
| `sessionTtlHours` | `168` (7 days) | Session lifetime. |
| `cookieName` | `forge_session` | Session cookie name. |

## The first admin (`seed`)

At boot, if **no** admin exists, the `seed` creates one with the "Super
admin" role (all permissions, automatically). If at least one admin already
exists, the `seed` is ignored — it is idempotent, leave it in place.

Without a `seed` and with no admin in the database, Forge still boots but
says so **loudly**, with the instruction to create one (via `seed` or
`admin.auth.createAdmin(…)`).

::: tip
Pass the seed credentials through environment variables, never hardcoded —
it is a production password like any other.
:::

## Tables & migrations

System migrations run automatically at boot: **lazy** (triggered on first
use), **idempotent**, and tracked in `forge_migrations`. They only ever touch
`forge_`-prefixed tables — never your business tables.

| Table | Contents |
|---|---|
| `forge_roles` | `name` (unique), `permissions` (JSON array of strings). |
| `forge_admins` | `email` (unique), `name`, `password_hash` (PBKDF2-SHA256, 210,000 iterations, WebCrypto), `role_id` (FK), `totp_secret` / `totp_enabled`, `disabled_at`, `created_at`. |
| `forge_sessions` | `token_hash` — the DB only stores the SHA-256 of the token — `admin_id`, `expires_at`, `elevated_until`. |

Two columns lay groundwork for what's next: `totp_*` is a **generic** 2FA
foundation (ready for the OTP extension), and `elevated_until` carries
session **elevation** (confirming sensitive actions).

::: warning Multi-dialect
Every migration step carries per-dialect variants: Postgres is supported
today, MySQL/MariaDB/MongoDB are planned along with their adapters. The
module requires an adapter that exposes `raw` — the built-in Postgres adapter
does.
:::

## The installed routes

- `GET /login` and `POST /login` — the kit's `forge/Login` page, email +
  password form. On failure: "Invalid credentials.", in **constant time**
  (anti-enumeration: no way to guess whether the email exists).
- `POST /logout` — destroys the session.

The session cookie is `HttpOnly` + `SameSite=Lax` (+ `Secure` over https).
The engine already redirects anonymous visitors to `/login` — nothing else to
wire.

## The "Administration" menu

The module installs itself with Forge's own building blocks (dogfooding): one
resource and one custom page, grouped under an "Administration" menu.

### Admins resource (`<prefix>/forge-admins`)

List, detail and edit for admins: name, role (via `belongsTo`), 2FA and
Status (active / disabled) badges. Create and delete are **disabled** in the
CRUD, on purpose:

- **Create**: via `seed` or `admin.auth.createAdmin(…)`.
- **Remove**: you don't delete an admin, you **disable** them (`disabled_at`)
  — history stays attributable.

### Roles & permissions (`<prefix>/system/roles`)

Role editing, with a **dynamic** permission catalog: it is derived from the
registry on **every request** — the resources' `*.read`/`*.write` policies,
field permissions, action permissions, custom page permissions. Declare a new
permission anywhere in the app: it shows up in the catalog with nothing to
sync.

- The "All permissions" toggle stores the special `"*"` permission, expanded
  to the full catalog at runtime — so a `"*"` role also covers future
  permissions.
- Deleting a role: the admins holding it lose their role (hence their
  permissions), without being deleted. The **Super admin** role is
  indestructible.

## The `admin.auth` API

`forge({ auth })` exposes the API on the return value (`admin.auth`, type
`AuthApi`):

| Method | Role |
|---|---|
| `permissions(c)` | The permission resolver (the one wired by default). |
| `currentAdmin(c)` | The current session's admin, or `null`. |
| `createAdmin({ email, password, name?, roleId? })` | Creates an admin from code (onboarding script, CLI…). |
| `elevate(c, minutes)` / `isElevated(c)` | Marks / checks an **elevated** session — the foundation for confirming sensitive actions. |
| `ready` | Init promise (migrations + seed) — handy in tests. |

```ts
// Example: a business route that requires an elevated session
admin.app.post("/api/danger", async (c) => {
  if (!await admin.auth.isElevated(c)) return c.json({ error: "elevate" }, 403)
  // …
})
```

## Security

- **Passwords**: PBKDF2-SHA256, 210,000 iterations, via WebCrypto — zero
  dependencies, Deno Deploy ready.
- **Sessions**: the token is **never** stored in clear — the DB only knows
  its SHA-256. A dump of the table cannot replay a session.
- **CSRF**: the facade's same-origin guard is active on login, logout and
  role editing.
- **Constant-time login**: same response time whether the email exists or
  not.

::: tip Elevation & OTP
`elevate` / `isElevated` and the `totp_*` columns are the foundation of an
upcoming OTP extension: code confirmation for sensitive actions (temporary
session elevation) and 2FA at login. The infrastructure is already in place —
the extension will just plug into it.
:::
