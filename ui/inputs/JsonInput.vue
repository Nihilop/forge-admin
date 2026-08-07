<script setup lang="ts">
// Saisie des champs `json` — textarea monospace. La row porte souvent un objet
// déjà désérialisé (driver json/jsonb) : le computed le pretty-print à la
// lecture SANS muter le modèle avant montage (un set au setup serait perdu).
// Dès la première frappe, le modèle devient une chaîne (validée serveur).
import { computed } from "vue"
import { Textarea } from "@forge/primitives/textarea"
import type { PublicField } from "../fields"

const model = defineModel<unknown>()
defineProps<{ field: PublicField }>()

const text = computed({
  get: () => {
    const v = model.value
    if (v == null) return ""
    if (typeof v === "object") return JSON.stringify(v, null, 2)
    return String(v)
  },
  set: (s: string) => (model.value = s),
})
</script>

<template>
  <Textarea
    v-model="text"
    class="min-h-32 font-mono text-sm"
    rows="8"
    :disabled="field.locked"
    spellcheck="false"
  />
</template>
