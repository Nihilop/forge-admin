// Layout INJECTABLE — Forge ne connaît pas le chrome de l'hôte. Les pages rendent
// `<component :is="useForgeLayout()">`. L'hôte fournit son layout via
// `provide(FORGE_LAYOUT, MonLayout)` (au montage de l'app) ; sinon, fallback sur
// le layout passthrough par défaut. C'est ce qui rend Forge « scoped ».

import { type Component, inject, type InjectionKey } from "vue"
import ForgeLayout from "./ForgeLayout.vue"

export const FORGE_LAYOUT: InjectionKey<Component> = Symbol("forge-layout")

/** Layout courant : celui injecté par l'hôte, sinon le défaut. */
export function useForgeLayout(): Component {
  return inject(FORGE_LAYOUT, ForgeLayout)
}
