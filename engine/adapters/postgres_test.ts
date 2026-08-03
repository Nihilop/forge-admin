import { assert, assertEquals } from "jsr:@std/assert@^1"
import { postgresAdapter } from "./postgres.ts"
import { defineResource } from "../resource.ts"
import { badge, belongsTo, text } from "../field.ts"
import type { Row } from "../adapter.ts"

/** Exécuteur factice : capture chaque requête, renvoie des lignes cannées. */
function fake(rows: Row[] = []) {
  const calls: { sql: string; params: unknown[] }[] = []
  const query = (sql: string, params?: unknown[]) => {
    calls.push({ sql, params: params ?? [] })
    return Promise.resolve(rows)
  }
  return { calls, query }
}

const def = defineResource({
  name: "t-pg-items",
  table: "items",
  label: "Items",
  policy: "items",
  search: ["name", "ref"],
  fields: [
    text("name", { editable: true, searchable: true }),
    badge("status", {
      editable: true,
      options: [{ value: "on", label: "On" }, { value: "off", label: "Off" }],
    }),
  ],
})

const softDef = defineResource({
  name: "t-pg-soft",
  table: "soft_items",
  label: "Soft",
  policy: "items",
  softDelete: "deleted_at",
  fields: [text("name")],
})

Deno.test("postgres · list : recherche ILIKE + filtre facetté + tri + pagination, tout paramétré", async () => {
  const { calls, query } = fake()
  const db = postgresAdapter({ query })
  const status = def.fields.find((f) => f.key === "status")!
  await db.list(def, {
    q: "clavier",
    filters: [{ field: status, value: "on" }],
    fields: def.fields,
    sort: { field: def.fields[0], dir: "asc" },
    limit: 25,
    offset: 50,
  })
  const { sql, params } = calls[0]
  assert(sql.includes(`"name" ILIKE $1`) && sql.includes(`"ref" ILIKE $2`), `recherche: ${sql}`)
  assert(sql.includes(`= $3`), `filtre: ${sql}`)
  assertEquals(params, ["%clavier%", "%clavier%", "on"]) // la valeur ne va JAMAIS dans le SQL
  assert(
    sql.includes("ASC NULLS LAST") && sql.includes("LIMIT 25 OFFSET 50"),
    `tri/pagination: ${sql}`,
  )
})

Deno.test("postgres · count partage le même WHERE que list", async () => {
  const { calls, query } = fake([{ n: 7 }])
  const db = postgresAdapter({ query })
  const n = await db.count(def, { q: "x", filters: [] })
  assertEquals(n, 7)
  assert(calls[0].sql.startsWith(`SELECT COUNT(*)::int`), calls[0].sql)
  assert(calls[0].sql.includes("ILIKE"), calls[0].sql)
})

Deno.test("postgres · create : INSERT paramétré + RETURNING id ; values vide → DEFAULT VALUES", async () => {
  const { calls, query } = fake([{ id: 42 }])
  const db = postgresAdapter({ query })
  const id = await db.create(def, { name: "A", status: "on" })
  assertEquals(id, "42")
  assert(
    calls[0].sql.includes(`("name", "status")`) && calls[0].sql.includes(`RETURNING "id"`),
    calls[0].sql,
  )
  assertEquals(calls[0].params, ["A", "on"])

  await db.create(def, {})
  assert(calls[1].sql.includes("DEFAULT VALUES"), calls[1].sql)
})

Deno.test("postgres · delete : hard par défaut, soft (UPDATE) si softDelete", async () => {
  const { calls, query } = fake()
  const db = postgresAdapter({ query })
  await db.delete(def, "1")
  assert(calls[0].sql.startsWith("DELETE FROM"), calls[0].sql)
  await db.delete(softDef, "2")
  assert(
    calls[1].sql.startsWith("UPDATE") && calls[1].sql.includes(`"deleted_at" = now()`),
    calls[1].sql,
  )
})

Deno.test("postgres · get filtre les soft-supprimés ; getRaw non (état pour hooks)", async () => {
  const { calls, query } = fake()
  const db = postgresAdapter({ query })
  await db.get(softDef, "1")
  assert(calls[0].sql.includes(`"deleted_at" IS NULL`), calls[0].sql)
  await db.getRaw(softDef, "1")
  assert(calls[1].sql.startsWith("SELECT *") && !calls[1].sql.includes("deleted_at"), calls[1].sql)
})

Deno.test("postgres · belongsTo : projection {id,label} qualifiée par la table externe", async () => {
  const rel = defineResource({
    name: "t-pg-orders",
    table: "t_orders",
    label: "Orders",
    policy: "items",
    fields: [
      belongsTo("item", { resource: "t-pg-items", column: "item_id", labelField: "name" }),
    ],
  })
  const { calls, query } = fake()
  const db = postgresAdapter({ query })
  await db.get(rel, "1")
  assert(calls[0].sql.includes(`json_build_object('id', "t_orders"."item_id"`), calls[0].sql)
  assert(calls[0].sql.includes(`FROM "items" AS _rel`), calls[0].sql)
})

Deno.test("postgres · relationOptions : borné, trié par label, soft-delete respecté", async () => {
  const { calls, query } = fake([{ value: 1, label: "A" }])
  const db = postgresAdapter({ query })
  const opts = await db.relationOptions({ table: "soft_items", softDelete: "deleted_at" }, "name")
  assertEquals(opts, [{ value: "1", label: "A" }])
  assert(
    calls[0].sql.includes(`"deleted_at" IS NULL`) && calls[0].sql.includes("LIMIT 500"),
    calls[0].sql,
  )
})
