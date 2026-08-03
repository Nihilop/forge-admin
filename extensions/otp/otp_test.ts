// Tests de l'extension OTP — unitaires TOTP (vecteurs OFFICIELS RFC 6238) +
// intégration PGlite bout-en-bout : enrollment, challenge 2FA au login,
// anti-replay, élévation (requireElevation → verify → rejeu).

import { assert, assertEquals } from "jsr:@std/assert@^1"
import { PGlite } from "@electric-sql/pglite"
import { forge } from "../../admin/mod.ts"
import { base32Decode, base32Encode, totp, verifyTotp } from "./totp.ts"
import { otpApiOf, otpServer } from "./server.ts"

// ── Unitaires TOTP ──

// Secret des vecteurs RFC 6238 (SHA-1) : "12345678901234567890" en ASCII.
const RFC_SECRET = base32Encode(new TextEncoder().encode("12345678901234567890"))

Deno.test("totp · vecteurs officiels RFC 6238 (SHA-1, 6 derniers chiffres)", async () => {
  const vectors: [number, string][] = [
    [59_000, "287082"],
    [1111111109_000, "081804"],
    [1111111111_000, "050471"],
    [1234567890_000, "005924"],
    [2000000000_000, "279037"],
  ]
  for (const [at, expected] of vectors) {
    assertEquals(await totp(RFC_SECRET, at), expected, `t=${at}`)
  }
})

Deno.test("totp · base32 : aller-retour + tolérance (espaces, minuscules)", () => {
  const bytes = crypto.getRandomValues(new Uint8Array(20))
  const encoded = base32Encode(bytes)
  assertEquals(base32Decode(encoded), bytes)
  assertEquals(base32Decode(encoded.toLowerCase().replace(/(.{4})/g, "$1 ")), bytes)
})

Deno.test("totp · verifyTotp : fenêtre ±1 pas, anti-replay", async () => {
  const at = 1111111111_000
  const code = await totp(RFC_SECRET, at)
  // Accepté au pas courant et au pas suivant (dérive d'horloge).
  const counter = await verifyTotp(RFC_SECRET, code, null, at)
  assert(counter != null)
  assert((await verifyTotp(RFC_SECRET, code, null, at + 30_000)) != null)
  // ANTI-REPLAY : le même compteur ne repasse pas.
  assertEquals(await verifyTotp(RFC_SECRET, code, counter, at), null)
  // Code invalide.
  assertEquals(await verifyTotp(RFC_SECRET, "000000", null, at), null)
})

// ── Intégration PGlite ──

const pg = new PGlite()
const query = async (sql: string, params?: unknown[]) => {
  const r = await pg.query(sql, (params ?? []) as unknown[])
  return r.rows as Record<string, unknown>[]
}

const admin = forge({
  db: { query },
  auth: { seed: { email: "otp@example.com", password: "otp-pass-1234" } },
  title: "OtpTest",
  extensions: [otpServer({ issuer: "OtpTest", elevationMinutes: 5 })],
})
const otp = otpApiOf(admin)
admin.app.post("/sensitive", otp.requireElevation(), (c) => c.json({ done: true }))

const inertiaHeaders = { "X-Inertia": "true", "X-Inertia-Version": "1.0.0" }

function cookieOf(res: Response, name: string): string {
  for (const [k, v] of res.headers.entries()) {
    if (k === "set-cookie" && v.startsWith(`${name}=`)) return v.split(";")[0]
  }
  return ""
}

async function login(password = "otp-pass-1234"): Promise<Response> {
  return await admin.fetch(
    new Request("http://localhost/login", {
      method: "POST",
      redirect: "manual",
      headers: { ...inertiaHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ email: "otp@example.com", password }),
    }),
  )
}

async function post(path: string, cookie: string, body: unknown): Promise<Response> {
  return await admin.fetch(
    new Request(`http://localhost${path}`, {
      method: "POST",
      redirect: "manual",
      headers: { ...inertiaHeaders, "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(body),
    }),
  )
}

async function secretOf(): Promise<string> {
  const rows = await query(`SELECT totp_secret FROM forge_admins WHERE email = 'otp@example.com'`)
  return String(rows[0].totp_secret)
}

Deno.test("otp · migrations : colonnes/table de l'extension présentes", async () => {
  await otp.ready
  const col = await query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'forge_admins' AND column_name = 'totp_last_counter'`,
  )
  assertEquals(col.length, 1)
  const tbl = await query(
    `SELECT table_name FROM information_schema.tables WHERE table_name = 'forge_otp_challenges'`,
  )
  assertEquals(tbl.length, 1)
})

Deno.test("otp · élévation SOUPLE : sans 2FA enrôlée, l'élévation est inapplicable → passe", async () => {
  const session = cookieOf(await login(), "forge_session")
  // Mode souple + pas de 2FA : requireElevation laisse passer directement.
  const okRes = await post("/sensitive", session, {})
  assertEquals(okRes.status, 200)
  assertEquals((await okRes.json()).done, true)
  // Et le POST elevate direct (chemin ensureElevated) est accordé sans code.
  const elevate = await post("/admin/system/otp/elevate", session, { code: "" })
  assertEquals((await elevate.json()).ok, true)
})

Deno.test("otp · enrollment : generate → secret, enable avec un vrai code TOTP", async () => {
  const session = cookieOf(await login(), "forge_session")
  const gen = await post("/admin/system/otp/generate", session, {})
  assertEquals(gen.status, 303)
  const secret = await secretOf()
  assert(secret.length >= 32, "secret base32 attendu")

  // La page setup expose le secret en attente + l'URI otpauth.
  const setup = await admin.fetch(
    new Request("http://localhost/admin/system/otp", {
      headers: { ...inertiaHeaders, Cookie: session },
    }),
  )
  const page = await setup.json()
  assertEquals(page.component, "forge/OtpSetup")
  assertEquals(page.props.enabled, false)
  assertEquals(page.props.pendingSecret, secret)
  assert(String(page.props.uri).startsWith("otpauth://totp/OtpTest"))

  // Mauvais code → erreur, pas activé.
  const bad = await post("/admin/system/otp/enable", session, { code: "000000" })
  assertEquals((await bad.json()).props.error, true)

  // Vrai code → activé.
  const good = await post("/admin/system/otp/enable", session, { code: await totp(secret) })
  assertEquals(good.status, 303)
  const row = await query(`SELECT totp_enabled FROM forge_admins WHERE email = 'otp@example.com'`)
  assertEquals(row[0].totp_enabled, true)
})

Deno.test("otp · login avec 2FA : challenge exigé, code vérifié, session créée", async () => {
  const secret = await secretOf()
  // Le mot de passe seul ne crée PLUS de session : page de challenge + cookie.
  const step1 = await login()
  assertEquals(step1.status, 200)
  const challengePage = await step1.json()
  assertEquals(challengePage.component, "forge/OtpChallenge")
  const challengeCookie = cookieOf(step1, "forge_otp_challenge")
  assert(challengeCookie.length > 20)
  assertEquals(cookieOf(step1, "forge_session"), "") // pas de session encore

  // Mauvais code → re-challenge.
  const bad = await post("/login/otp", challengeCookie, { code: "111111" })
  assertEquals((await bad.json()).props.error, true)

  // Bon code (pas suivant — l'enable a consommé le compteur courant) → session.
  const code = await totp(secret, Date.now() + 30_000)
  const done = await post("/login/otp", challengeCookie, { code })
  assertEquals(done.status, 303)
  const session = cookieOf(done, "forge_session")
  assert(session.length > 20, "cookie de session attendu après le challenge")
  const list = await admin.fetch(
    new Request("http://localhost/admin/forge-admins", {
      headers: { ...inertiaHeaders, Cookie: session },
    }),
  )
  assertEquals(list.status, 200)
})

Deno.test("otp · élévation STRICTE avec 2FA : code exigé puis action rejouée", async () => {
  const secret = await secretOf()
  // L'anti-replay (fenêtre ±1 pas de 30 s) empêcherait des vérifications
  // consécutives dans le même pas — les tests précédents ont consommé la
  // fenêtre. On le RESET entre chaque vérification (c'est lui qu'on contourne,
  // pas la vérification du code).
  const resetReplay = () =>
    query(`UPDATE forge_admins SET totp_last_counter = NULL WHERE email = 'otp@example.com'`)

  // Login complet (challenge + code).
  await resetReplay()
  const step1 = await login()
  const challengeCookie = cookieOf(step1, "forge_otp_challenge")
  const done = await post("/login/otp", challengeCookie, { code: await totp(secret) })
  assertEquals(done.status, 303)
  const session = cookieOf(done, "forge_session")

  // Action sensible : 403 → elevate sans code refusé (2FA active) → avec code OK.
  const denied = await post("/sensitive", session, {})
  assertEquals(denied.status, 403)
  assertEquals((await denied.json()).forge, "elevation-required")
  const noCode = await post("/admin/system/otp/elevate", session, { code: "" })
  assertEquals(noCode.status, 400)
  await resetReplay()
  const withCode = await post("/admin/system/otp/elevate", session, { code: await totp(secret) })
  assertEquals((await withCode.json()).ok, true)
  const okRes = await post("/sensitive", session, {})
  assertEquals((await okRes.json()).done, true)
})
