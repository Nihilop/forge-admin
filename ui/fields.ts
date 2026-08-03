// Forge · kit Vue — registre des composants d'affichage par type de champ.
// Un consommateur peut enregistrer ses propres composants (escape hatch) via
// registerDisplay() et y opter avec `display: "<nom>"` sur un champ.

import type { Component } from "vue"
import TextDisplay from "./displays/TextDisplay.vue"
import BadgeDisplay from "./displays/BadgeDisplay.vue"
import DateDisplay from "./displays/DateDisplay.vue"
import RelationDisplay from "./displays/RelationDisplay.vue"
import MarkdownDisplay from "./displays/MarkdownDisplay.vue"

export interface PublicField {
  key: string
  type: string
  label: string
  options?: { value: string; label: string; tone?: string }[]
  display?: string
  input?: string
  editable?: boolean
  required?: boolean
  relation?: { resource: string; column: string; labelField: string }
  /** Champ à permission que l'opérateur n'a pas → saisie verrouillée (lecture seule). */
  locked?: boolean
  /** Détail : affiché pleine largeur sous la grille d'infos (contenus longs). */
  wide?: boolean
}

const byType: Record<string, Component> = {
  text: TextDisplay,
  email: TextDisplay,
  select: TextDisplay,
  badge: BadgeDisplay,
  date: DateDisplay,
  belongsTo: RelationDisplay,
}

// Displays NOMMÉS fournis par le kit (opt-in via `display: "<nom>"` sur un champ).
const builtinNamed: Record<string, Component> = {
  markdown: MarkdownDisplay,
}

const customDisplays = new Map<string, Component>()

/** Escape hatch : enregistre un composant d'affichage custom (clé → composant). */
export function registerDisplay(name: string, component: Component): void {
  customDisplays.set(name, component)
}

/** Résout le composant d'affichage d'un champ (custom > builtin nommé > type > fallback). */
export function displayFor(field: PublicField): Component {
  if (field.display && customDisplays.has(field.display)) return customDisplays.get(field.display)!
  if (field.display && builtinNamed[field.display]) return builtinNamed[field.display]
  return byType[field.type] ?? TextDisplay
}
