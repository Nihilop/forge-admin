// Forge · kit Vue — registre des composants de SAISIE par type de champ (le
// pendant de fields.ts pour les formulaires). Escape hatch via registerInput().

import type { Component } from "vue"
import TextInput from "./inputs/TextInput.vue"
import SelectInput from "./inputs/SelectInput.vue"
import TextareaInput from "./inputs/TextareaInput.vue"
import MarkdownInput from "./inputs/MarkdownInput.vue"
import NumberInput from "./inputs/NumberInput.vue"
import BooleanInput from "./inputs/BooleanInput.vue"
import DatetimeInput from "./inputs/DatetimeInput.vue"
import JsonInput from "./inputs/JsonInput.vue"
import type { PublicField } from "./fields"

const byType: Record<string, Component> = {
  text: TextInput,
  email: TextInput,
  date: TextInput,
  select: SelectInput,
  badge: SelectInput,
  belongsTo: SelectInput,
  number: NumberInput,
  boolean: BooleanInput,
  textarea: TextareaInput,
  datetime: DatetimeInput,
  json: JsonInput,
}

// Inputs NOMMÉS fournis par le kit (opt-in via `input: "<nom>"` sur un champ).
const builtinNamed: Record<string, Component> = {
  textarea: TextareaInput,
  markdown: MarkdownInput,
}

const customInputs = new Map<string, Component>()

/** Escape hatch : enregistre un composant de saisie custom. */
export function registerInput(name: string, component: Component): void {
  customInputs.set(name, component)
}

/** Résout le composant de saisie d'un champ (custom > builtin nommé > type > fallback). */
export function inputFor(field: PublicField): Component {
  if (field.input && customInputs.has(field.input)) return customInputs.get(field.input)!
  if (field.input && builtinNamed[field.input]) return builtinNamed[field.input]
  return byType[field.type] ?? TextInput
}
