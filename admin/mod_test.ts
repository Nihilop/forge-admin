import { assert, assertEquals } from "jsr:@std/assert@^1"
import { defaultSameOrigin, forge, openPermissions, resolveDb } from "./mod.ts"
import { defineResource, type ForgeAdapter, postgresAdapter, type Row, text } from "forge/engine"

/** Adapter factice : pas de stockage, données cannées. */
function fakeAdapter(rows: Row[]): ForgeAdapter {
  return {
    count: () => Promise.resolve(rows.length),
    list: () => Promise.resolve(rows),
    get: (_d, id) => Promise.resolve(rows.find((r) => String(r.id) === id) ?? null),
    getRaw: (_d, id) => Promise.resolve(rows.find((r) => String(r.id) === id) ?? null),
    children: () => Promise.resolve([]),
    relationOptions: () => Promise.resolve([]),
    create: () => Promise.resolve("99"),
    update: () => Promise.resolve(),
    delete: () => Promise.resolve(),
  }
}

defineResource({
  name: "f-items",
  table: "f_items",
  label: "Items",
  policy: "fitems",
  fields: [text("name", { editable: true, permission: "fitems.rename" })],
})

const inertiaHeaders = { "X-Inertia": "true", "X-Inertia-Version": "1.0.0" }

Deno.test("forge() · GET liste : 200, page du moteur, prefix custom dans les props", async () => {
  const admin = forge({
    db: fakeAdapter([{ id: 1, name: "A" }]),
    permissions: "open",
    prefix: "/back",
  })
  const res = await admin.fetch(
    new Request("http://localhost/back/f-items", { headers: inertiaHeaders }),
  )
  assertEquals(res.status, 200)
  const page = await res.json()
  assertEquals(page.component, "forge/ResourceIndex")
  assertEquals(page.props.prefix, "/back")
  assertEquals(page.props.rows.length, 1)
  // Les props PARTAGÉES de la façade sont là aussi (nav + prefix).
  assert("forge" in page.props)
})

Deno.test("forge() · anti-CSRF par défaut : POST cross-site bloqué, same-origin accepté", async () => {
  const admin = forge({ db: fakeAdapter([{ id: 1, name: "A" }]), permissions: "open" })
  const post = (headers: Record<string, string>) =>
    admin.fetch(
      new Request("http://localhost/admin/f-items/1", {
        method: "POST",
        redirect: "manual",
        headers: { ...inertiaHeaders, "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ name: "B" }),
      }),
    )

  const evil = await post({ Origin: "http://evil.example" })
  assertEquals(evil.status, 303)
  assertEquals(evil.headers.get("location"), "/") // rejeté → redirect racine

  const ok = await post({ Origin: "http://localhost" })
  assertEquals(ok.status, 303)
  assertEquals(ok.headers.get("location"), "/admin/f-items/1") // écrit → retour fiche
})

Deno.test("forge() · extensions serveur : install reçoit l'app assemblée", async () => {
  let seenPrefix: string | undefined
  const admin = forge({
    db: fakeAdapter([]),
    permissions: "open",
    extensions: [{
      name: "test-ext",
      install: (a) => {
        seenPrefix = a.prefix
        a.app.get("/ext/ping", (c) => c.json({ pong: true }))
      },
    }],
  })
  assertEquals(seenPrefix, "/admin")
  const res = await admin.fetch(new Request("http://localhost/ext/ping"))
  assertEquals((await res.json()).pong, true)
})

Deno.test("forge() · home : redirige la racine", async () => {
  const admin = forge({
    db: fakeAdapter([]),
    permissions: "open",
    home: "/admin/f-items",
  })
  const res = await admin.fetch(new Request("http://localhost/", { redirect: "manual" }))
  assertEquals(res.headers.get("location"), "/admin/f-items")
})

Deno.test("openPermissions · dérive policy + permissions de champs du registre", () => {
  const perms = openPermissions()
  assert(perms.includes("fitems.read") && perms.includes("fitems.write"))
  assert(perms.includes("fitems.rename")) // permission de champ
})

Deno.test("permissions · liste statique : un champ hors permission reste verrouillé", async () => {
  const admin = forge({
    db: fakeAdapter([{ id: 1, name: "A" }]),
    permissions: ["fitems.read", "fitems.write"], // PAS fitems.rename
  })
  const res = await admin.fetch(
    new Request("http://localhost/admin/f-items/1/edit", { headers: inertiaHeaders }),
  )
  const page = await res.json()
  const name = page.props.resource.fields.find((f: { key: string }) => f.key === "name")
  assertEquals(name.locked, true)
})

Deno.test("resolveDb · adapter passthrough, exécuteur enveloppé en Postgres", async () => {
  const adapter = fakeAdapter([])
  assertEquals(resolveDb(adapter), adapter) // même référence

  const calls: string[] = []
  const wrapped = resolveDb({
    query: (sql) => {
      calls.push(sql)
      return Promise.resolve([{ n: 3 }])
    },
  })
  const def = defineResource({
    name: "f-db",
    table: "f_db",
    label: "X",
    policy: "fitems",
    fields: [text("name")],
  })
  const n = await wrapped.count(def, {})
  assertEquals(n, 3)
  assert(calls[0].includes("COUNT(*)")) // c'est bien l'adapter Postgres derrière

  // Cohérence : même comportement que postgresAdapter directement.
  assert(typeof postgresAdapter === "function")
})

Deno.test("defaultSameOrigin · Sec-Fetch-Site prioritaire, Origin en repli, rien → laissé passer", () => {
  const ctx = (headers: Record<string, string>) =>
    ({
      req: {
        header: (k: string) => headers[k.toLowerCase()],
        url: "http://localhost:8083/admin/x",
      },
      // deno-lint-ignore no-explicit-any
    }) as any
  assert(defaultSameOrigin(ctx({ "sec-fetch-site": "same-origin" })))
  assert(!defaultSameOrigin(ctx({ "sec-fetch-site": "cross-site" })))
  assert(defaultSameOrigin(ctx({ origin: "http://localhost:8083" })))
  assert(!defaultSameOrigin(ctx({ origin: "http://evil.example" })))
  assert(defaultSameOrigin(ctx({})))
})
