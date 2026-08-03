// Layout INJECTABLE — les pages rendent `<component :is="useForgeLayout()">`.
// Par DÉFAUT : le shell clé en main du kit (ForgeShell — sidebar auto, topbar,
// thème, langue, outlets d'extension). L'hôte peut fournir SON chrome via
// `provide(FORGE_LAYOUT, MonLayout)` au montage de l'app, ou revenir au
// passthrough nu (ForgeBareLayout) s'il gère tout lui-même.

import { type Component, inject, type InjectionKey } from "vue"
import ForgeShell from "./shell/ForgeShell.vue"
import ForgeBareLayout from "./ForgeLayout.vue"

export const FORGE_LAYOUT: InjectionKey<Component> = Symbol("forge-layout")

/** Le passthrough minimal (aucun chrome) — `provide(FORGE_LAYOUT, ForgeBareLayout)`. */
export { ForgeBareLayout }

/** Le shell par défaut du kit (exporté pour composition/extension). */
export { ForgeShell }

/** Layout courant : celui injecté par l'hôte, sinon le ForgeShell par défaut. */
export function useForgeLayout(): Component {
  return inject(FORGE_LAYOUT, ForgeShell)
}
