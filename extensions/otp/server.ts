// Forge · extension OTP — moitié SERVEUR. Première extension communautaire de
// référence : fournie avec la lib, DÉSACTIVÉE par défaut (opt-in explicite via
// `forge({ extensions: [otpServer()] })`). S'appuie sur le modèle Admin du
// module auth (colonnes totp_* déjà migrées) + ses propres migrations
// (challenges de login, anti-replay). Expose l'ÉLÉVATION : confirmation OTP
// des actions que le dev estime sensibles (`requireElevation`).

import type { Context } from "hono"
import { getCookie } from "hono/cookie"
import { forgePage, type Row } from "../../engine/mod.ts"
import type { ForgeApp, ForgeExtension } from "../../admin/mod.ts"
import { type MigrationStepDef, runMigrationSteps } from "../../admin/auth/migrations.ts"
import { randomToken, sha256hex } from "../../admin/auth/crypto.ts"
import { generateTotpSecret, otpauthUri, verifyTotp } from "./totp.ts"

/** Options de l'extension OTP. */
export interface OtpOptions {
  /** Émetteur affiché dans l'app d'authentification. Défaut : `Forge`. */
  issuer?: string
  /** Durée d'une ÉLÉVATION (minutes). Défaut : `10`. */
  elevationMinutes?: number
  /** `true` → `requireElevation` BLOQUE les admins sans 2FA enrôlée.
   *  Défaut `false` : sans 2FA, l'élévation est accordée (inapplicable). */
  strict?: boolean
}

/** L'API exposée par l'extension une fois installée ({@linkcode otpApiOf}). */
export interface OtpApi {
  /** Middleware Hono : exige une session ÉLEVÉE. Sinon : 403 typé
   *  `{ forge: "elevation-required" }` — le front `useElevation()` intercepte,
   *  demande le code et rejoue l'action. */
  requireElevation: () => (c: Context, next: () => Promise<void>) => Promise<Response | void>
  /** Promesse de fin d'init (migrations de l'extension) — utile en test. */
  ready: Promise<void>
}

const CHALLENGE_COOKIE = "forge_otp_challenge"
const CHALLENGE_TTL_SECONDS = 300

// Migrations PROPRES à l'extension (ids préfixés `otp_`, suivi partagé dans
// `forge_migrations`). Anti-replay par admin + challenges de login éphémères.
const OTP_STEPS: MigrationStepDef[] = [
  {
    id: "otp_0001_core",
    dialects: {
      postgres: [
        `ALTER TABLE forge_admins ADD COLUMN IF NOT EXISTS totp_last_counter BIGINT`,
        `CREATE TABLE IF NOT EXISTS forge_otp_challenges (
          token_hash TEXT PRIMARY KEY,
          admin_id   BIGINT NOT NULL REFERENCES forge_admins (id) ON DELETE CASCADE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`,
      ],
    },
  },
]

// L'API par instance de façade (une app peut monter plusieurs forge()).
const apis = new WeakMap<ForgeApp, OtpApi>()

/** L'API OTP d'une app (après `forge({ extensions: [otpServer()] })`). */
export function otpApiOf(admin: ForgeApp): OtpApi {
  const api = apis.get(admin)
  if (!api) throw new Error("Forge OTP: extension non installée sur cette app.")
  return api
}

/** La moitié serveur de l'extension OTP/2FA : challenge 2FA au login,
 *  enrollment (`<prefix>/system/otp`), élévation. Le pendant front est
 *  `otpUi()` (`@forge/extensions/otp`). */
export function otpServer(options: OtpOptions = {}): ForgeExtension {
  return {
    name: "otp",
    install: (admin) => {
      apis.set(admin, installOtp(admin, options))
    },
  }
}

function installOtp(admin: ForgeApp, options: OtpOptions): OtpApi {
  const authOpt = admin.auth
  if (!authOpt) throw new Error("Forge OTP: le module `auth` builtin est requis (forge({ auth })).")
  // Rebind typé : le narrowing ne se propage pas dans les closures.
  const auth: NonNullable<ForgeApp["auth"]> = authOpt
  const rawExec = admin.adapter.raw
  if (!rawExec) throw new Error("Forge OTP: l'adapter ne fournit pas `raw`.")
  const raw: (query: string, params?: unknown[]) => Promise<Row[]> = rawExec

  const issuer = options.issuer ?? "Forge"
  const elevationMinutes = options.elevationMinutes ?? 10
  const app = admin.app
  const prefix = admin.prefix
  const setupPath = `${prefix}/system/otp`

  // Migrations de l'extension — après celles de l'auth. Chaque handler attend.
  const ready = auth.ready.then(() => runMigrationSteps(raw, OTP_STEPS)).then(() => {})

  const redirect303 = (to: string): Response =>
    new Response(null, { status: 303, headers: { location: to } })

  function withCookie(res: Response, name: string, value: string, maxAge: number): Response {
    const headers = new Headers(res.headers)
    headers.append(
      "set-cookie",
      `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`,
    )
    return new Response(res.body, { status: res.status, headers })
  }

  async function adminRowById(id: string): Promise<Row | null> {
    const rows = await raw(`SELECT * FROM forge_admins WHERE id = $1`, [id])
    return rows[0] ?? null
  }

  /** Vérifie un code pour un admin, avec anti-replay persisté. */
  async function checkCode(adminRow: Row, code: string): Promise<boolean> {
    const secret = adminRow.totp_secret == null ? null : String(adminRow.totp_secret)
    if (!secret) return false
    const last = adminRow.totp_last_counter == null ? null : Number(adminRow.totp_last_counter)
    const counter = await verifyTotp(secret, code, last)
    if (counter == null) return false
    await raw(`UPDATE forge_admins SET totp_last_counter = $1 WHERE id = $2`, [
      counter,
      adminRow.id,
    ])
    return true
  }

  // ── CHALLENGE 2FA au login : interrompt la création de session. ──
  auth.setLoginChallenge(async (c, adminRow) => {
    await ready
    if (adminRow.totp_enabled !== true) return null // pas de 2FA → login normal
    const token = randomToken()
    await raw(
      `INSERT INTO forge_otp_challenges (token_hash, admin_id, expires_at)
       VALUES ($1, $2, now() + interval '${CHALLENGE_TTL_SECONDS} seconds')`,
      [await sha256hex(token), adminRow.id],
    )
    const page = await admin.render(c, forgePage("OtpChallenge"), {})
    return withCookie(page, CHALLENGE_COOKIE, token, CHALLENGE_TTL_SECONDS)
  })

  // Vérifie le code du challenge et termine le login.
  app.post("/login/otp", async (c) => {
    await ready
    const token = getCookie(c, CHALLENGE_COOKIE)
    if (!token) return redirect303("/login")
    const rows = await raw(
      `SELECT admin_id FROM forge_otp_challenges WHERE token_hash = $1 AND expires_at > now()`,
      [await sha256hex(token)],
    )
    if (!rows[0]) return withCookie(redirect303("/login"), CHALLENGE_COOKIE, "", 0)
    const body = await c.req.json().catch(() => ({})) as { code?: string }
    const adminRow = await adminRowById(String(rows[0].admin_id))
    if (!adminRow || !(await checkCode(adminRow, String(body.code ?? "")))) {
      return admin.render(c, forgePage("OtpChallenge"), { error: true })
    }
    await raw(`DELETE FROM forge_otp_challenges WHERE token_hash = $1`, [await sha256hex(token)])
    const done = await auth.completeLogin(c, String(adminRow.id))
    return withCookie(done, CHALLENGE_COOKIE, "", 0)
  })

  // ── ENROLLMENT : <prefix>/system/otp (chaque admin gère SA 2FA). ──
  async function currentFullAdmin(c: Context): Promise<Row | null> {
    const current = await auth.currentAdmin(c)
    return current ? await adminRowById(current.id) : null
  }

  // État 2FA de l'admin courant (JSON) — consommé par la section « Profil »
  // de l'extension (outlet `profile:sections`).
  app.get(`${setupPath}/state`, async (c) => {
    await ready
    const me = await currentFullAdmin(c)
    if (!me) return c.json({ ok: false, error: "unauthenticated" }, 401)
    return c.json({ ok: true, enabled: me.totp_enabled === true })
  })

  app.get(setupPath, async (c) => {
    await ready
    const me = await currentFullAdmin(c)
    if (!me) return redirect303("/login")
    const enabled = me.totp_enabled === true
    const pendingSecret = !enabled && me.totp_secret != null ? String(me.totp_secret) : undefined
    return admin.render(c, forgePage("OtpSetup"), {
      enabled,
      pendingSecret,
      uri: pendingSecret ? otpauthUri(pendingSecret, String(me.email), issuer) : undefined,
      prefix,
    })
  })

  app.post(`${setupPath}/generate`, async (c) => {
    await ready
    const me = await currentFullAdmin(c)
    if (!me) return redirect303("/login")
    if (me.totp_enabled !== true) {
      await raw(
        `UPDATE forge_admins SET totp_secret = $1, totp_last_counter = NULL WHERE id = $2`,
        [generateTotpSecret(), me.id],
      )
    }
    return redirect303(setupPath)
  })

  app.post(`${setupPath}/enable`, async (c) => {
    await ready
    const me = await currentFullAdmin(c)
    if (!me) return redirect303("/login")
    const body = await c.req.json().catch(() => ({})) as { code?: string }
    if (me.totp_secret == null || !(await checkCode(me, String(body.code ?? "")))) {
      const secret = me.totp_secret == null ? undefined : String(me.totp_secret)
      return admin.render(c, forgePage("OtpSetup"), {
        enabled: false,
        pendingSecret: secret,
        uri: secret ? otpauthUri(secret, String(me.email), issuer) : undefined,
        prefix,
        error: true,
      })
    }
    await raw(`UPDATE forge_admins SET totp_enabled = true WHERE id = $1`, [me.id])
    return redirect303(setupPath)
  })

  app.post(`${setupPath}/disable`, async (c) => {
    await ready
    const me = await currentFullAdmin(c)
    if (!me) return redirect303("/login")
    const body = await c.req.json().catch(() => ({})) as { code?: string }
    if (!(await checkCode(me, String(body.code ?? "")))) {
      return admin.render(c, forgePage("OtpSetup"), { enabled: true, prefix, error: true })
    }
    await raw(
      `UPDATE forge_admins SET totp_enabled = false, totp_secret = NULL, totp_last_counter = NULL
       WHERE id = $1`,
      [me.id],
    )
    return redirect303(setupPath)
  })

  // ── ÉLÉVATION : vérifie un code et marque la session élevée N minutes. ──
  app.post(`${setupPath}/elevate`, async (c) => {
    await ready
    const me = await currentFullAdmin(c)
    if (!me) return c.json({ ok: false, error: "unauthenticated" }, 401)
    const body = await c.req.json().catch(() => ({})) as { code?: string }
    if (me.totp_enabled !== true) {
      if (options.strict) return c.json({ ok: false, error: "totp-not-enrolled" }, 400)
      await auth.elevate(c, elevationMinutes)
      return c.json({ ok: true })
    }
    if (!(await checkCode(me, String(body.code ?? "")))) {
      return c.json({ ok: false, error: "invalid-code" }, 400)
    }
    await auth.elevate(c, elevationMinutes)
    return c.json({ ok: true })
  })

  // Pas d'entrée de menu : la page 2FA se rejoint depuis la page PROFIL, où
  // l'extension injecte sa section via l'outlet `profile:sections`.

  return {
    ready,
    requireElevation: () => async (c, next) => {
      await ready
      const me = await currentFullAdmin(c)
      if (!me) return c.json({ ok: false, error: "unauthenticated" }, 401)
      if (me.totp_enabled !== true && !options.strict) return await next() // inapplicable
      if (await auth.isElevated(c)) return await next()
      return c.json({ forge: "elevation-required" }, 403)
    },
  }
}
