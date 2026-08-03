// Forge · kit Vue — résolution des icônes de nav (le serveur envoie un NOM
// d'icône ; le front le résout en composant). Carte intégrée pour les courantes
// + registerNavIcon() pour les custom (escape hatch). Fallback : un point.

import type { Component } from "vue"
import {
  PhAddressBook,
  PhArrowsClockwise,
  PhBlueprint,
  PhBracketsAngle,
  PhBriefcase,
  PhBuildings,
  PhDesktopTower,
  PhDotOutline,
  PhFileText,
  PhGearSix,
  PhKey,
  PhProhibit,
  PhPulse,
  PhShieldCheck,
  PhSparkle,
  PhTable,
  PhUser,
  PhUsersThree,
} from "@phosphor-icons/vue"

export interface ForgeNavEntry {
  name: string
  href: string
  label: string
  group: string
  order: number
  icon?: string
  permission?: string
  exact?: boolean
}

const builtin: Record<string, Component> = {
  user: PhUser,
  users: PhUsersThree,
  building: PhBuildings,
  device: PhDesktopTower,
  table: PhTable,
  gear: PhGearSix,
  key: PhKey,
  contacts: PhAddressBook,
  shield: PhShieldCheck,
  pulse: PhPulse,
  prohibit: PhProhibit,
  reactivate: PhArrowsClockwise,
  blueprint: PhBlueprint,
  position: PhBriefcase,
  file: PhFileText,
  sparkle: PhSparkle,
  api: PhBracketsAngle,
}

const custom = new Map<string, Component>()

/** Escape hatch : enregistre une icône de nav custom. */
export function registerNavIcon(name: string, component: Component): void {
  custom.set(name, component)
}

export function navIcon(name?: string): Component {
  if (name && custom.has(name)) return custom.get(name)!
  if (name && builtin[name]) return builtin[name]
  return PhDotOutline
}
