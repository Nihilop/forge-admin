import type { Updater } from "@tanstack/vue-table"
import type { Ref } from "vue"

// deno-lint-ignore no-explicit-any -- signature shadcn-vue d'origine (vendorée)
export function valueUpdater<T extends Updater<any>>(updaterOrValue: T, ref: Ref) {
  ref.value = typeof updaterOrValue === "function" ? updaterOrValue(ref.value) : updaterOrValue
}
