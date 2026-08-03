// Forge · kit Vue — SYSTÈME D'EXTENSIONS front. Une extension regroupe tout ce
// qu'une feature optionnelle (2FA, notifications, menu user…) doit brancher
// côté client : composants d'outlets du shell, displays/inputs de champs,
// icônes de nav, messages i18n, et un hook libre. Le kit n'embarque AUCUNE de
// ces features par défaut — il expose les points d'ancrage.
//
//   installForgeExtensions(app, [twoFactorUi()], { i18n })
//
// Le pendant SERVEUR (routes, resources, pages) passe par l'option
// `extensions` de la façade forge() — voir @streemkit/forge (ForgeExtension).

import type { App, Component } from "vue"
import { registerShellItem } from "./shell/registry"
import { registerDisplay } from "./fields"
import { registerInput } from "./inputs"
import { registerNavIcon } from "./nav"

/** Instance vue-i18n minimale (ce que `installForgeExtensions` en utilise). */
export interface ForgeI18nLike {
  global: { mergeLocaleMessage(locale: string, messages: Record<string, unknown>): void }
}

/** Une extension UI : des composants et messages branchés sur les points
 *  d'ancrage du kit. Tous les champs sont optionnels. */
export interface ForgeUiExtension {
  /** Nom unique (diagnostic). */
  name: string
  /** Composants montés dans les outlets du shell (`{ "header:end": Comp, … }`).
   *  Outlets fournis : `header:start`, `header:end`, `sidebar:footer`. */
  outlets?: Record<string, Component>
  /** Composants d'affichage de champ (`display: "<nom>"` sur un champ). */
  displays?: Record<string, Component>
  /** Composants de saisie de champ (`input: "<nom>"` sur un champ). */
  inputs?: Record<string, Component>
  /** Icônes de nav (résolues par nom : `nav.icon`, `action.icon`). */
  icons?: Record<string, Component>
  /** Messages i18n fusionnés par locale (nécessite `i18n` à l'install). */
  messages?: Record<string, Record<string, unknown>>
  /** Hook libre exécuté à l'installation (plugins, provide, directives…). */
  setup?: (ctx: { app: App }) => void
}

/** Installe des extensions UI : enregistre outlets, displays, inputs, icônes,
 *  fusionne les messages i18n et exécute les hooks `setup`. À appeler AVANT
 *  `app.mount()`. */
export function installForgeExtensions(
  app: App,
  extensions: ForgeUiExtension[],
  opts: { i18n?: ForgeI18nLike } = {},
): void {
  for (const ext of extensions) {
    for (const [outlet, comp] of Object.entries(ext.outlets ?? {})) {
      registerShellItem(outlet, comp)
    }
    for (const [name, comp] of Object.entries(ext.displays ?? {})) registerDisplay(name, comp)
    for (const [name, comp] of Object.entries(ext.inputs ?? {})) registerInput(name, comp)
    for (const [name, comp] of Object.entries(ext.icons ?? {})) registerNavIcon(name, comp)
    if (ext.messages) {
      if (!opts.i18n) {
        console.warn(`[forge] extension "${ext.name}" : messages i18n ignorés (passez { i18n }).`)
      } else {
        for (const [locale, messages] of Object.entries(ext.messages)) {
          opts.i18n.global.mergeLocaleMessage(locale, messages)
        }
      }
    }
    ext.setup?.({ app })
  }
}
