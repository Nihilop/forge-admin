import { assert, assertEquals, assertThrows } from "jsr:@std/assert@^1"
import { defineResource, forgeNav, getResource } from "./resource.ts"
import { definePage } from "./page.ts"
import { text } from "./field.ts"

Deno.test("resource · registre : defineResource → getResource", () => {
  const def = defineResource({
    name: "t-widgets",
    table: "widgets",
    label: "Widgets",
    policy: "widgets",
    fields: [text("name")],
  })
  assertEquals(getResource("t-widgets"), def)
  assertEquals(getResource("inconnu"), undefined)
})

Deno.test("resource · policy obligatoire (garde-fou RBAC)", () => {
  assertThrows(
    // @ts-expect-error policy manquante volontairement
    () => defineResource({ name: "t-nopolicy", table: "x", label: "X", fields: [text("name")] }),
    Error,
    "policy",
  )
})

Deno.test("nav · fusion resources ⊕ pages, tri par ordre, permission dérivée de la policy", () => {
  defineResource({
    name: "t-nav-r",
    table: "x",
    label: "R",
    policy: "widgets",
    nav: { group: "t-g", order: 2 },
    fields: [text("name")],
  })
  definePage({
    name: "t-nav-p",
    href: "/t-p",
    label: "P",
    exact: true,
    nav: { group: "t-g", order: 1 },
  })

  const entries = forgeNav().filter((e) => e.group === "t-g")
  assertEquals(entries.map((e) => e.name), ["t-nav-p", "t-nav-r"]) // trié par order
  const r = entries.find((e) => e.name === "t-nav-r")!
  assertEquals(r.permission, "widgets.read") // dérivée de la policy
  assertEquals(r.href, "/admin/t-nav-r")
  const p = entries.find((e) => e.name === "t-nav-p")!
  assertEquals(p.exact, true)
  assertEquals(p.href, "/t-p")
})

Deno.test("nav · resource sans `nav` absente du menu", () => {
  defineResource({
    name: "t-hidden",
    table: "x",
    label: "H",
    policy: "widgets",
    fields: [text("name")],
  })
  assert(!forgeNav().some((e) => e.name === "t-hidden"))
})
