// Tests d'INTÉGRATION de l'auth builtin — sur un vrai Postgres (PGlite, en
// mémoire) : migrations, seed, login/logout, sessions, résolveur RBAC, page
// rôles (catalogue dynamique). Toute la pile HTTP est traversée via fetch.

import { assert, assertEquals } from "jsr:@std/assert@^1"
import { PGlite } from "@electric-sql/pglite"
import { forge } from "./mod.ts"
import { defineResource, text } from "../engine/mod.ts"

// Base dédiée au fichier de test (état partagé entre les étapes, exprès).
const pg = new PGlite()
const query = async (sql: string, params?: unknown[]) => {
  const r = await pg.query(sql, (params ?? []) as unknown[])
  return r.rows as Record<string, unknown>[]
}

// Une resource métier AVEC une policy custom : elle doit apparaître dans le
// catalogue DYNAMIQUE de la page rôles.
defineResource({
  name: "t-auth-items",
  table: "t_auth_items",
  label: "Items",
  policy: "zzz.custom",
  fields: [text("name")],
})

const admin = forge({
  db: { query },
  auth: { seed: { email: "root@example.com", password: "s3cret-forge", name: "Root" } },
  title: "AuthTest",
})

const inertiaHeaders = { "X-Inertia": "true", "X-Inertia-Version": "1.0.0" }

function cookieOf(res: Response): string {
  const set = res.headers.get("set-cookie") ?? ""
  return set.split(";")[0]
}

async function login(email: string, password: string): Promise<Response> {
  return await admin.fetch(
    new Request("http://localhost/login", {
      method: "POST",
      redirect: "manual",
      headers: { ...inertiaHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  )
}

Deno.test("auth · migrations + seed : tables système créées, admin initial présent", async () => {
  await admin.auth!.ready
  const tables = await query(
    `SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'forge_%' ORDER BY 1`,
  )
  const names = tables.map((t) => String(t.table_name))
  for (const t of ["forge_admins", "forge_migrations", "forge_roles", "forge_sessions"]) {
    assert(names.includes(t), `table manquante : ${t}`)
  }
  const admins = await query(`SELECT email, role_id FROM forge_admins`)
  assertEquals(admins.length, 1)
  assertEquals(admins[0].email, "root@example.com")
  assert(admins[0].role_id != null, "l'admin seed doit avoir le rôle Super admin")
})

Deno.test("auth · anonyme : le CRUD redirige vers /login, /login rend la page kit", async () => {
  const crud = await admin.fetch(
    new Request("http://localhost/admin/forge-admins", {
      headers: inertiaHeaders,
      redirect: "manual",
    }),
  )
  assertEquals(crud.status, 303)
  assertEquals(crud.headers.get("location"), "/login")

  const page = await admin.fetch(
    new Request("http://localhost/login", { headers: inertiaHeaders }),
  )
  const json = await page.json()
  assertEquals(json.component, "forge/Login")
  assertEquals(json.props.title, "AuthTest")
})

Deno.test("auth · login : échec propre, succès avec cookie de session", async () => {
  const bad = await login("root@example.com", "mauvais")
  const badPage = await bad.json()
  assertEquals(badPage.props.errors._form, "Identifiants invalides.")

  const ok = await login("root@example.com", "s3cret-forge")
  assertEquals(ok.status, 303)
  assertEquals(ok.headers.get("location"), "/admin")
  const cookie = cookieOf(ok)
  assert(cookie.startsWith("forge_session="), "cookie de session attendu")
  assert((ok.headers.get("set-cookie") ?? "").includes("HttpOnly"))
})

Deno.test("auth · session : accès au CRUD admins, admins listés, permissions * effectives", async () => {
  const ok = await login("root@example.com", "s3cret-forge")
  const cookie = cookieOf(ok)
  const list = await admin.fetch(
    new Request("http://localhost/admin/forge-admins", {
      headers: { ...inertiaHeaders, Cookie: cookie },
    }),
  )
  assertEquals(list.status, 200)
  const page = await list.json()
  assertEquals(page.component, "forge/ResourceIndex")
  assertEquals(page.props.rows.length, 1)
  assertEquals(page.props.rows[0].email, "root@example.com")
  // Le menu Administration est dans la nav partagée.
  const nav = (page.props.forge as { nav: { group: string; label: string }[] }).nav
  assert(nav.some((e) => e.group === "Administration" && e.label === "Admins"))
  assert(nav.some((e) => e.group === "Administration" && e.label === "Rôles & permissions"))
})

Deno.test("auth · page rôles : catalogue DYNAMIQUE (contient les policies custom)", async () => {
  const ok = await login("root@example.com", "s3cret-forge")
  const cookie = cookieOf(ok)
  const res = await admin.fetch(
    new Request("http://localhost/admin/system/roles", {
      headers: { ...inertiaHeaders, Cookie: cookie },
    }),
  )
  assertEquals(res.status, 200)
  const page = await res.json()
  assertEquals(page.component, "forge/Roles")
  const catalog = page.props.catalog as string[]
  // Dérivé du registre : la policy custom déclarée dans CE test y est.
  assert(catalog.includes("zzz.custom.read") && catalog.includes("zzz.custom.write"))
  assert(catalog.includes("forge.admins.read") && catalog.includes("forge.roles.write"))
  assertEquals((page.props.roles as unknown[]).length >= 1, true)
})

Deno.test("auth · rôles : création + permissions limitées appliquées de bout en bout", async () => {
  const root = cookieOf(await login("root@example.com", "s3cret-forge"))
  // Crée un rôle limité puis le renseigne.
  await admin.fetch(
    new Request("http://localhost/admin/system/roles", {
      method: "POST",
      redirect: "manual",
      headers: { ...inertiaHeaders, "Content-Type": "application/json", Cookie: root },
      body: JSON.stringify({ name: "Lecteur" }),
    }),
  )
  const role = await query(`SELECT id FROM forge_roles WHERE name = 'Lecteur'`)
  await admin.fetch(
    new Request(`http://localhost/admin/system/roles/${role[0].id}`, {
      method: "POST",
      redirect: "manual",
      headers: { ...inertiaHeaders, "Content-Type": "application/json", Cookie: root },
      body: JSON.stringify({ name: "Lecteur", permissions: ["forge.admins.read"] }),
    }),
  )
  // Un admin avec ce rôle : lit les admins, mais PAS la page rôles.
  await admin.auth!.createAdmin({
    email: "viewer@example.com",
    password: "viewer-pass-123",
    roleId: String(role[0].id),
  })
  const viewer = cookieOf(await login("viewer@example.com", "viewer-pass-123"))
  const canRead = await admin.fetch(
    new Request("http://localhost/admin/forge-admins", {
      headers: { ...inertiaHeaders, Cookie: viewer },
    }),
  )
  assertEquals(canRead.status, 200)
  const denied = await admin.fetch(
    new Request("http://localhost/admin/system/roles", {
      headers: { ...inertiaHeaders, Cookie: viewer },
      redirect: "manual",
    }),
  )
  assertEquals(denied.status, 303)
  assertEquals(denied.headers.get("location"), "/")
})

Deno.test("auth · redirection post-login : la racine du CRUD mène à une vraie page", async () => {
  const cookie = cookieOf(await login("root@example.com", "s3cret-forge"))
  // Le login redirige vers <prefix> — qui doit lui-même rediriger vers une
  // entrée EXISTANTE (la première du menu dans le périmètre du préfixe).
  const root = await admin.fetch(
    new Request("http://localhost/admin", {
      headers: { ...inertiaHeaders, Cookie: cookie },
      redirect: "manual",
    }),
  )
  assertEquals(root.status, 303)
  const target = root.headers.get("location")!
  assert(target.startsWith("/admin/"), `cible attendue sous /admin/, reçu ${target}`)
  const page = await admin.fetch(
    new Request(`http://localhost${target}`, { headers: { ...inertiaHeaders, Cookie: cookie } }),
  )
  assertEquals(page.status, 200)
})

Deno.test("auth · logout : session détruite, cookie purgé", async () => {
  const ok = await login("root@example.com", "s3cret-forge")
  const cookie = cookieOf(ok)
  const out = await admin.fetch(
    new Request("http://localhost/logout", {
      method: "POST",
      redirect: "manual",
      headers: { ...inertiaHeaders, Cookie: cookie },
    }),
  )
  assertEquals(out.headers.get("location"), "/login")
  assert((out.headers.get("set-cookie") ?? "").includes("Max-Age=0"))
  const after = await admin.fetch(
    new Request("http://localhost/admin/forge-admins", {
      headers: { ...inertiaHeaders, Cookie: cookie },
      redirect: "manual",
    }),
  )
  assertEquals(after.headers.get("location"), "/login")
})

Deno.test("auth · profil : page rendue avec l'admin courant + entrée de menu", async () => {
  const cookie = cookieOf(await login("root@example.com", "s3cret-forge"))
  const res = await admin.fetch(
    new Request("http://localhost/admin/system/profile", {
      headers: { ...inertiaHeaders, Cookie: cookie },
    }),
  )
  assertEquals(res.status, 200)
  const page = await res.json()
  assertEquals(page.component, "forge/Profile")
  const me = page.props.admin as { email: string; role: string | null }
  assertEquals(me.email, "root@example.com")
  assertEquals(me.role, "Super admin")
  const nav = (page.props.forge as { nav: { group: string; label: string }[] }).nav
  assert(nav.some((e) => e.group === "Administration" && e.label === "Profil"))
})

Deno.test("auth · profil : mise à jour du nom affiché", async () => {
  const cookie = cookieOf(await login("root@example.com", "s3cret-forge"))
  const res = await admin.fetch(
    new Request("http://localhost/admin/system/profile", {
      method: "POST",
      redirect: "manual",
      headers: { ...inertiaHeaders, "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "Rooty" }),
    }),
  )
  assertEquals(res.status, 303)
  assertEquals(res.headers.get("location"), "/admin/system/profile")
  const rows = await query(`SELECT name FROM forge_admins WHERE email = 'root@example.com'`)
  assertEquals(rows[0].name, "Rooty")
})

Deno.test("auth · profil : changement de mot de passe (l'actuel est vérifié)", async () => {
  await admin.auth!.createAdmin({ email: "pwd@example.com", password: "premier-pass-123" })
  const cookie = cookieOf(await login("pwd@example.com", "premier-pass-123"))
  const post = (body: Record<string, string>) =>
    admin.fetch(
      new Request("http://localhost/admin/system/profile/password", {
        method: "POST",
        redirect: "manual",
        headers: { ...inertiaHeaders, "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify(body),
      }),
    )
  // Mot de passe actuel erroné → erreur de validation, rien ne change.
  const wrong = await (await post({ current: "faux", next: "nouveau-pass-123" })).json()
  assertEquals(wrong.props.errors.current, "Mot de passe actuel incorrect.")
  // Nouveau trop court → erreur dédiée.
  const short = await (await post({ current: "premier-pass-123", next: "court" })).json()
  assertEquals(short.props.errors.next, "8 caractères minimum.")
  // Succès : l'ancien ne passe plus, le nouveau ouvre une session.
  const ok = await post({ current: "premier-pass-123", next: "nouveau-pass-123" })
  assertEquals(ok.status, 303)
  const old = await (await login("pwd@example.com", "premier-pass-123")).json()
  assertEquals(old.props.errors._form, "Identifiants invalides.")
  const fresh = await login("pwd@example.com", "nouveau-pass-123")
  assertEquals(fresh.status, 303)
})

Deno.test("auth · élévation : marquage et lecture (socle de l'extension OTP)", async () => {
  const cookie = cookieOf(await login("root@example.com", "s3cret-forge"))
  // Contexte Hono minimal : seul req.header/cookie est utilisé par l'API.
  const fakeCtx = {
    req: {
      raw: new Request("http://localhost/", { headers: { Cookie: cookie } }),
      header: (name: string) => name.toLowerCase() === "cookie" ? cookie : undefined,
      url: "http://localhost/",
    },
    // deno-lint-ignore no-explicit-any
  } as any
  assertEquals(await admin.auth!.isElevated(fakeCtx), false)
  await admin.auth!.elevate(fakeCtx, 10)
  assertEquals(await admin.auth!.isElevated(fakeCtx), true)
})
