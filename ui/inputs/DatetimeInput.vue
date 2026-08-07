<script setup lang="ts">
// Saisie des champs `datetime` — input natif datetime-local. La row porte un
// ISO-8601 (UTC) : on le convertit en heure LOCALE pour l'input, et la valeur
// saisie repart telle quelle (le moteur la normalise en ISO à l'écriture).
import { computed } from "vue"
import { Input } from "@forge/primitives/input"
import type { PublicField } from "../fields"

const model = defineModel<string>()
defineProps<{ field: PublicField }>()

function toLocalInput(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${
    pad(d.getMinutes())
  }`
}

const local = computed({
  get: () => (model.value ? toLocalInput(model.value) : ""),
  set: (v: string) => (model.value = v),
})
</script>

<template>
  <Input v-model="local" type="datetime-local" :disabled="field.locked" />
</template>
