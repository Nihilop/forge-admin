# 2FA & elevation (OTP extension)

The OTP extension is Forge's **first official extension**: it brings **TOTP
2FA** (compatible with Google Authenticator, Aegis, 1Password…), the **login
challenge** and **session elevation** — code confirmation for the actions
*you* deem sensitive. It plugs into the foundation already laid by the
[built-in auth](auth) (`totp_*` columns, `elevate`/`isElevated`).

::: tip Shipped, but disabled by default
The extension ships **with** the lib, but never activates on its own —
enabling it is an explicit opt-in, in two halves (server + frontend). This is
the **model for future community extensions**: a server module passed to
`extensions: […]`, a UI module passed to `installForgeExtensions`.
:::

## Enabling the extension

Two halves, one per side. The server half requires the built-in auth
(`forge({ auth })`).

**Server** (`main.ts`):

```ts
import { otpApiOf, otpServer } from "@streemkit/forge/extensions/otp"

const admin = forge({
  db,
  auth: { seed },
  extensions: [otpServer({ issuer: "MyApp" })],
})
```

**Frontend** (`src/main.ts`):

```ts
import { otpUi } from "@forge/extensions/otp"

installForgeExtensions(app, [otpUi()], { i18n })
```

That's it: the "Security (2FA)" page shows up under the **Administration**
menu, the challenge slots into the login of 2FA-enabled admins, and the
elevation dialog is mounted (through the shell's [`overlays`](outlets)
outlet).

## The options (`OtpOptions`)

| Option | Default | Role |
|---|---|---|
| `issuer` | `"Forge"` | Issuer name shown in the authenticator app. |
| `elevationMinutes` | `10` | Lifetime of a session elevation (minutes). |
| `strict` | `false` | `true` → `requireElevation` **blocks** admins without enrolled 2FA (see [elevation](#elevation-marking-an-action-as-sensitive)). |

## What admins experience

### Enrollment — the "Security (2FA)" page

Each admin manages **their own** 2FA, on `<prefix>/system/otp`
(Administration menu):

1. **Generate a secret** — the page shows the `otpauth://` URI (QR-ready)
   plus the plain key for manual entry.
2. **Add it to their authenticator app** (Google Authenticator, Aegis,
   1Password…).
3. **Confirm a 6-digit code** — that confirmation is what **activates** 2FA.
   Until it happens, nothing changes at login.

**Disabling** is protected the same way: it requires a valid code.

### Login challenge

Once an admin's 2FA is active, the password alone is no longer enough: after
the email + password step, a "6-digit code" page slots in **before** the
session is created. The challenge is ephemeral (5 minutes) — past that, back
to the login page.

## Elevation: marking an action as sensitive

This is the key feature for you as a dev: requiring a **recent OTP
confirmation** before a dangerous action (bulk delete, key rotation,
refund…). A session stays **elevated** for `elevationMinutes` minutes after a
confirmation — no re-typing on every click.

### Server side

`otpApiOf(admin)` exposes the `requireElevation()` middleware:

```ts
const otp = otpApiOf(admin)

admin.app.post("/danger", otp.requireElevation(), (c) => {
  // You only get here with an elevated session.
  return c.json({ done: true })
})
```

Without an elevated session, the route answers a **typed 403**
`{ forge: "elevation-required" }` — the marker the frontend intercepts.

### Frontend side

`ensureElevated(prefix)` guarantees an elevated session: already elevated →
resolves immediately; otherwise it opens the shared OTP dialog (mounted by
`otpUi()`), verifies the code, and resolves.

```ts
import { ensureElevated } from "@forge/extensions/otp"

async function onDanger() {
  if (await ensureElevated(prefix)) {
    // …call the sensitive action…
  }
}
```

It resolves `true` once elevation is acquired, `false` if the admin cancels
the dialog.

### Lenient mode vs `strict`

By default (**lenient**), an admin **without** enrolled 2FA is not blocked:
elevation is inapplicable, hence granted — the extension activates without
breaking anyone's flow. With `strict: true`, `requireElevation` demands
enrollment: no 2FA, no sensitive action.

## Migrations

The extension brings its **own** migrations (login challenges, anti-replay):
automatic at boot, idempotent, tracked in `forge_migrations` alongside the
auth ones. It builds on the `totp_*` columns already provisioned by the
[auth module](auth#tables-migrations) — nothing to do on your side.

## Security

- **TOTP RFC 6238**, 100% WebCrypto — zero dependencies, Deno Deploy ready.
  The ecosystem defaults (6 digits, 30 s step), with a ±30 s clock-tolerance
  window.
- **Anti-replay**: a code is only good **once** — the last accepted counter
  is persisted per admin.
- **Ephemeral challenge**: the login challenge expires after 5 minutes and is
  destroyed after use.
- **Protected disabling**: turning your 2FA off requires a valid code.

::: tip Want to see it all running?
The [example app](playground) enables the extension: "Security (2FA)" page in
the menu, "sensitive action" demo on the dashboard.
:::
