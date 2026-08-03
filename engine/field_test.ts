import { assert, assertEquals } from "jsr:@std/assert@^1"
import { badge, belongsTo, publicField, text } from "./field.ts"

Deno.test("field · text : défauts (label humanisé, list true, non éditable)", () => {
  const f = text("legal_name")
  assertEquals(f.type, "text")
  assertEquals(f.label, "Legal name")
  assertEquals(f.list, true)
  assert(!f.editable)
})

Deno.test("field · options passées telles quelles", () => {
  const f = badge("status", {
    options: [{ value: "on", label: "On", tone: "success" }],
    editable: true,
  })
  assertEquals(f.options?.length, 1)
  assertEquals(f.editable, true)
})

Deno.test("field · belongsTo : relation structurée", () => {
  const f = belongsTo("owner", {
    resource: "persons",
    column: "owner_person_id",
    labelField: "legal_name",
    editable: true,
  })
  assertEquals(f.type, "belongsTo")
  assertEquals(f.relation, {
    resource: "persons",
    column: "owner_person_id",
    labelField: "legal_name",
  })
})

Deno.test("field · publicField : ne fuit PAS les détails serveur (column/writeColumn/permission)", () => {
  const f = text("dob", {
    column: "dob::text",
    writeColumn: "dob",
    permission: "customers.kyc.write",
    editable: true,
  })
  // Cast volontaire vers un index-signature : on vérifie l'ABSENCE de clés
  // (column/writeColumn/permission) que le type PublicField ne déclare pas.
  const pub = publicField(f) as unknown as Record<string, unknown>
  assertEquals(pub.column, undefined)
  assertEquals(pub.writeColumn, undefined)
  assertEquals(pub.permission, undefined)
  assertEquals(pub.key, "dob")
  assertEquals(pub.editable, true)
})
