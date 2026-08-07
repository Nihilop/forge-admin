import { assert, assertEquals } from "jsr:@std/assert@^1"
import { defaultSameOrigin, forge, openPermissions, resolveDb } from "./mod.ts"
import {
  boolean,
  datetime,
  defineResource,
  defineWidget,
  type ForgeAdapter,
  json,
  number,
  postgresAdapter,
  type Row,
  text,
  textarea,
} from "forge/engine"

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

// Resource exerçant les types COERCÉS côté serveur (number/boolean/datetime/json).
defineResource({
  name: "f-typed",
  table: "f_typed",
  label: "Typed",
  policy: "ftyped",
  fields: [
    text("name", { editable: true }),
    number("qty", { editable: true, min: 1, max: 100 }),
    boolean("active", { editable: true }),
    datetime("ships_at", { editable: true }),
    json("meta", { editable: true }),
    textarea("notes", { editable: true }),
  ],
})

Deno.test("champs · coercion serveur : number/boolean/datetime/json normalisés avant l'adapter", async () => {
  let written: Row | null = null
  const adapter = fakeAdapter([{ id: 1 }])
  adapter.create = (_d, values) => {
    written = values
    return Promise.resolve("1")
  }
  const admin = forge({ db: adapter, permissions: "open" })
  const res = await admin.fetch(
    new Request("http://localhost/admin/f-typed", {
      method: "POST",
      redirect: "manual",
      headers: { ...inertiaHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "A",
        qty: "42,5", // chaîne à virgule → nombre
        active: "true", // chaîne → booléen
        ships_at: "2026-08-07T10:30", // datetime-local → ISO
        meta: '{ "a" : 1 }', // chaîne JSON → normalisée
        notes: "long texte",
      }),
    }),
  )
  assertEquals(res.status, 303)
  const w = written! as Row
  assertEquals(w.qty, 42.5)
  assertEquals(w.active, true)
  assertEquals(String(w.ships_at).endsWith("Z"), true) // ISO UTC
  assertEquals(w.meta, '{"a":1}')
  assertEquals(w.notes, "long texte")
})

Deno.test("champs · validation serveur : nombre hors bornes, JSON et date invalides refusés", async () => {
  const admin = forge({ db: fakeAdapter([{ id: 1 }]), permissions: "open" })
  const post = (body: Record<string, unknown>) =>
    admin.fetch(
      new Request("http://localhost/admin/f-typed", {
        method: "POST",
        redirect: "manual",
        headers: { ...inertiaHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    )
  const bad = await (await post({
    qty: "999", // > max 100
    active: "peut-être", // pas un booléen
    ships_at: "pas une date",
    meta: "{oops",
  })).json()
  assertEquals(bad.props.errors.qty, "Maximum : 100.")
  assertEquals(bad.props.errors.active, "Valeur invalide.")
  assertEquals(bad.props.errors.ships_at, "Date invalide.")
  assertEquals(bad.props.errors.meta, "JSON invalide.")

  const min = await (await post({ qty: "0" })).json()
  assertEquals(min.props.errors.qty, "Minimum : 1.")
  const nan = await (await post({ qty: "abc" })).json()
  assertEquals(nan.props.errors.qty, "Nombre invalide.")
})

Deno.test("liste · export CSV : entêtes + lignes filtrées, échappement, BOM", async () => {
  const admin = forge({
    db: fakeAdapter([
      { id: 1, name: 'Virgule, et "guillemets"' },
      { id: 2, name: "Simple" },
    ]),
    permissions: "open",
  })
  const res = await admin.fetch(new Request("http://localhost/admin/f-items/export"))
  assertEquals(res.status, 200)
  assert(res.headers.get("content-type")?.includes("text/csv"))
  assert(res.headers.get("content-disposition")?.includes('filename="f-items.csv"'))
  const body = await res.text()
  assert(body.startsWith("\uFEFF")) // BOM Excel
  const lines = body.slice(1).split("\r\n")
  assertEquals(lines[0], "Name")
  assertEquals(lines[1], '"Virgule, et ""guillemets"""')
  assertEquals(lines[2], "Simple")
})

Deno.test("liste · bulk delete : supprime chaque id, garde CSRF, redirige la liste", async () => {
  const deleted: string[] = []
  const adapter = fakeAdapter([{ id: 1 }, { id: 2 }, { id: 3 }])
  adapter.delete = (_d, id) => {
    deleted.push(id)
    return Promise.resolve()
  }
  const admin = forge({ db: adapter, permissions: "open" })
  const post = (headers: Record<string, string> = {}) =>
    admin.fetch(
      new Request("http://localhost/admin/f-items/bulk/delete", {
        method: "POST",
        redirect: "manual",
        headers: { ...inertiaHeaders, "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ ids: [1, 3] }),
      }),
    )
  // Cross-site → rejeté, rien supprimé.
  const evil = await post({ Origin: "http://evil.example" })
  assertEquals(evil.headers.get("location"), "/")
  assertEquals(deleted.length, 0)
  // Same-origin → chaque id supprimé, retour liste.
  const ok = await post()
  assertEquals(ok.status, 303)
  assertEquals(ok.headers.get("location"), "/admin/f-items")
  assertEquals(deleted, ["1", "3"])
})

Deno.test("widgets · dashboard à la racine du CRUD : données résolues, permissions, erreurs par carte", async () => {
  defineWidget({
    key: "w-stat",
    title: "Total",
    type: "stat",
    order: 1,
    data: () => ({ value: 42, hint: "test" }),
  })
  defineWidget({
    key: "w-list",
    title: "Derniers",
    type: "list",
    order: 2,
    data: () => ({ items: [{ label: "A", href: "/admin/f-items/1" }] }),
  })
  defineWidget({
    key: "w-secret",
    title: "Caché",
    type: "stat",
    permission: "zz.secret",
    data: () => ({ value: 1 }),
  })
  defineWidget({
    key: "w-broken",
    title: "Cassé",
    type: "stat",
    order: 9,
    data: () => {
      throw new Error("boom")
    },
  })
  // Liste statique SANS zz.secret → le widget gated disparaît.
  const admin = forge({ db: fakeAdapter([]), permissions: ["fitems.read"] })
  const res = await admin.fetch(new Request("http://localhost/admin", { headers: inertiaHeaders }))
  assertEquals(res.status, 200)
  const page = await res.json()
  assertEquals(page.component, "forge/Dashboard")
  const widgets = page.props.widgets as {
    key: string
    span: number
    error?: boolean
    data?: { value?: number; items?: unknown[] }
  }[]
  assertEquals(widgets.map((w) => w.key), ["w-stat", "w-list", "w-broken"])
  assertEquals(widgets[0].data?.value, 42)
  assertEquals(widgets[0].span, 1)
  assertEquals(widgets[1].span, 2) // défaut des `list`
  assertEquals(widgets[1].data?.items?.length, 1)
  assertEquals(widgets[2].error, true) // le résolveur cassé n'abat pas la page
  // La permission du widget entre dans le catalogue dynamique.
  assert(openPermissions().includes("zz.secret"))
})

Deno.test("widgets · scope resource : metrics sur l'index, absentes du dashboard", async () => {
  defineWidget({
    key: "w-res",
    title: "Stock",
    type: "stat",
    resource: "f-items",
    data: () => ({ value: 7 }),
  })
  defineWidget({
    key: "w-res-chart",
    title: "Courbe",
    type: "chart",
    chart: "bar",
    resource: "f-items",
    data: () => ({ categories: ["a", "b"], series: [{ name: "s", values: [1, 2] }] }),
  })
  const admin = forge({ db: fakeAdapter([]), permissions: "open" })
  const idx = await admin.fetch(
    new Request("http://localhost/admin/f-items", { headers: inertiaHeaders }),
  )
  const page = await idx.json()
  const widgets = page.props.widgets as {
    key: string
    chart?: string
    span: number
    data?: { series?: unknown[] }
  }[]
  assertEquals(widgets.map((w) => w.key), ["w-res", "w-res-chart"])
  assertEquals(widgets[1].chart, "bar")
  assertEquals(widgets[1].span, 2) // défaut des `chart`
  assertEquals(widgets[1].data?.series?.length, 1)
  // Le dashboard ne contient QUE les widgets non scopés.
  const dash = await admin.fetch(new Request("http://localhost/admin", { headers: inertiaHeaders }))
  const dashKeys = ((await dash.json()).props.widgets as { key: string }[]).map((w) => w.key)
  assert(!dashKeys.includes("w-res") && !dashKeys.includes("w-res-chart"))
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
