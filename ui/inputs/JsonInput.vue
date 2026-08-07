<script setup lang="ts">
// Saisie des champs `json` — textarea monospace. Si la row porte un objet déjà
// désérialisé (driver json/jsonb), il est pretty-printé une fois au montage ;
// ensuite la valeur reste une chaîne (validée/normalisée côté serveur).
import { Textarea } from "@forge/primitives/textarea"
import type { PublicField } from "../fields"

const model = defineModel<unknown>()
defineProps<{ field: PublicField }>()

if (model.value != null && typeof model.value === "object") {
  model.value = JSON.stringify(model.value, null, 2)
} else if (typeof model.value === "string" && model.value.trim().startsWith("{")) {
  try {
    model.value = JSON.stringify(JSON.parse(model.value), null, 2)
  } catch {
    // chaîne non parseable : laissée telle quelle, le serveur la refusera
  }
}
</script>

<template>
  <Textarea
    :model-value="model == null ? '' : String(model)"
    class="min-h-32 font-mono text-sm"
    rows="8"
    :disabled="field.locked"
    spellcheck="false"
    @update:model-value="(v: string | number) => (model = String(v))"
  />
</template>
