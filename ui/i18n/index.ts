// Forge · i18n — API du framework. Forge fournit ses messages de base
// (namespace `forge.*`, fr/en) ; l'HÔTE choisit la langue et peut fusionner ses
// propres messages par-dessus. Les composants du kit consomment `useI18n()`.

import { createI18n, useI18n } from "vue-i18n"
import { FORGE_I18N_NS } from "../brand"
import fr from "./fr"
import en from "./en"

// deno-lint-ignore no-explicit-any
type Messages = Record<string, any>

/** Messages de base de Forge, par locale. */
export const forgeMessages: Record<string, Messages> = { fr, en }

/** Fusionne les messages de l'hôte AU-DESSUS de ceux de Forge (l'hôte gagne). */
export function mergeForge(hostMessages: Record<string, Messages> = {}): Record<string, Messages> {
  const out: Record<string, Messages> = {}
  for (const loc of new Set([...Object.keys(forgeMessages), ...Object.keys(hostMessages)])) {
    out[loc] = { ...forgeMessages[loc], ...hostMessages[loc] }
  }
  return out
}

/** `t` scopé au namespace du kit : `t("actions.edit")` → `<ns>.actions.edit`.
 *  Les composants du kit passent TOUS par lui (le namespace vit dans brand.ts,
 *  jamais dans les templates). À appeler dans un setup(). */
export function useForgeT() {
  const { t } = useI18n()
  return (key: string, named?: Record<string, unknown>): string =>
    named === undefined ? t(`${FORGE_I18N_NS}.${key}`) : t(`${FORGE_I18N_NS}.${key}`, named)
}

/** Instance vue-i18n prête (Composition API). L'hôte fournit sa locale + ses
 *  messages (fusionnés au-dessus de Forge). `app.use(createForgeI18n())`. */
export function createForgeI18n(
  opts: { locale?: string; fallbackLocale?: string; messages?: Record<string, Messages> } = {},
) {
  return createI18n({
    legacy: false,
    globalInjection: true,
    locale: opts.locale ?? "fr",
    fallbackLocale: opts.fallbackLocale ?? "en",
    messages: mergeForge(opts.messages),
  })
}
