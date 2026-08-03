import { assertEquals } from "jsr:@std/assert@^1"
import { forgePrefix, setForgePrefix } from "./prefix.ts"
import { defineResource, forgeNav } from "./resource.ts"
import { text } from "./field.ts"
import { DEFAULT_ADMIN_PREFIX, FORGE_PAGE_NS, forgePage } from "./brand.ts"

Deno.test("prefix · défaut /admin, normalisation, et propagation à forgeNav()", () => {
  try {
    assertEquals(forgePrefix(), DEFAULT_ADMIN_PREFIX)

    // Normalisation : slash de tête ajouté, slash de fin retiré.
    assertEquals(setForgePrefix("back/"), "/back")
    assertEquals(setForgePrefix("/back-office"), "/back-office")
    // "" = montage à la racine ; undefined = inchangé.
    assertEquals(setForgePrefix(""), "")
    assertEquals(setForgePrefix(undefined), "")

    // forgeNav() suit le préfixe courant.
    setForgePrefix("/back")
    defineResource({
      name: "t-prefix-r",
      table: "x",
      label: "R",
      policy: "widgets",
      nav: { group: "t-prefix-g" },
      fields: [text("name")],
    })
    const entry = forgeNav().find((e) => e.name === "t-prefix-r")!
    assertEquals(entry.href, "/back/t-prefix-r")
  } finally {
    setForgePrefix(DEFAULT_ADMIN_PREFIX) // ne pas polluer les autres tests
  }
})

Deno.test("brand · forgePage compose le namespace des pages Inertia", () => {
  // Dérivé de FORGE_PAGE_NS (jamais de littéral) : le test survit au renommage.
  assertEquals(forgePage("ResourceIndex"), `${FORGE_PAGE_NS}/ResourceIndex`)
})
