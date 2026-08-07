// Forge · kit Vue — registre des composants d'affichage par type de champ.
// Un consommateur peut enregistrer ses propres composants (escape hatch) via
// registerDisplay() et y opter avec `display: "<nom>"` sur un champ.

import type { Component } from "vue"
import type { PublicField as EnginePublicField } from "../engine/field.ts"
import TextDisplay from "./displays/TextDisplay.vue"
import BadgeDisplay from "./displays/BadgeDisplay.vue"
import DateDisplay from "./displays/DateDisplay.vue"
import RelationDisplay from "./displays/RelationDisplay.vue"
import MarkdownDisplay from "./displays/MarkdownDisplay.vue"
import BooleanDisplay from "./displays/BooleanDisplay.vue"
import DatetimeDisplay from "./displays/DatetimeDisplay.vue"
import JsonDisplay from "./displays/JsonDisplay.vue"

/** La forme publique d'un champ, telle que le moteur l'envoie en props —
 *  MÊME type que côté serveur (import type pur, zéro code runtime), enrichi
 *  des drapeaux ajoutés par le moteur au rendu des formulaires. */
export interface PublicField extends EnginePublicField {
  /** Champ à permission que l'opérateur n'a pas → saisie verrouillée (lecture seule). */
  locked?: boolean
}

const byType: Record<string, Component> = {
  text: TextDisplay,
  email: TextDisplay,
  select: TextDisplay,
  badge: BadgeDisplay,
  date: DateDisplay,
  belongsTo: RelationDisplay,
  number: TextDisplay,
  boolean: BooleanDisplay,
  textarea: TextDisplay,
  datetime: DatetimeDisplay,
  json: JsonDisplay,
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
