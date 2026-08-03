// Forge · kit Vue — options du shell par défaut (ForgeShell). Fournies par
// l'hôte au boot : `app.provide(FORGE_SHELL_OPTIONS, { title: "Mon admin" })`.
// Tout est optionnel — sans provide, le shell a des défauts corrects.

import { type Component, inject, type InjectionKey } from "vue"

/** Options de personnalisation du shell par défaut. */
export interface ForgeShellOptions {
  /** Titre affiché dans la sidebar. Défaut : `Admin`. */
  title?: string
  /** Sous-titre discret à côté du titre (ex. `dev`, le nom du tenant…). */
  subtitle?: string
  /** Composant logo (remplace la pastille initiale par défaut). */
  logo?: Component
  /** Cible du clic sur le brand. Défaut : `/`. */
  homeHref?: string
  /** Affiche le toggle clair/sombre. Défaut : `true`. */
  themeToggle?: boolean
  /** Affiche le sélecteur de langue (si plusieurs locales i18n). Défaut : `true`. */
  localeSwitcher?: boolean
}

/** Clé d'injection des options du shell (`app.provide(FORGE_SHELL_OPTIONS, …)`). */
export const FORGE_SHELL_OPTIONS: InjectionKey<ForgeShellOptions> = Symbol("forge-shell-options")

/** Options effectives du shell (défauts appliqués). À appeler dans un setup(). */
export function useForgeShellOptions(): Required<Omit<ForgeShellOptions, "logo" | "subtitle">> & {
  logo?: Component
  subtitle?: string
} {
  const o = inject(FORGE_SHELL_OPTIONS, {})
  return {
    title: o.title ?? "Admin",
    subtitle: o.subtitle,
    logo: o.logo,
    homeHref: o.homeHref ?? "/",
    themeToggle: o.themeToggle ?? true,
    localeSwitcher: o.localeSwitcher ?? true,
  }
}
