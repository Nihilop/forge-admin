// Forge · kit Vue — résolution des icônes de nav (le serveur envoie un NOM
// d'icône ; le front le résout en composant). Carte intégrée pour les usages
// ADMIN courants + registerNavIcon() pour les custom (escape hatch, extensions).
// Fallback : un point.

import type { Component } from "vue"
import {
  PhBuildings,
  PhDotOutline,
  PhFileText,
  PhGauge,
  PhGearSix,
  PhKey,
  PhPackage,
  PhReceipt,
  PhRocketLaunch,
  PhShieldCheck,
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

// Vocabulaire d'icônes GÉNÉRIQUE d'un back-office (dashboard, catalogue,
// équipe, réglages…). Tout le reste passe par registerNavIcon().
const builtin: Record<string, Component> = {
  gauge: PhGauge,
  user: PhUser,
  users: PhUsersThree,
  building: PhBuildings,
  package: PhPackage,
  receipt: PhReceipt,
  table: PhTable,
  file: PhFileText,
  gear: PhGearSix,
  key: PhKey,
  shield: PhShieldCheck,
  rocket: PhRocketLaunch,
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
