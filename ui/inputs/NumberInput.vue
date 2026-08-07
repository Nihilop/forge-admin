<script setup lang="ts">
// Saisie des champs `number` — input natif type=number, bornes/pas du champ.
// La valeur voyage telle quelle (le moteur coerce et valide côté serveur).
import { Input } from "@forge/primitives/input"
import type { PublicField } from "../fields"

const model = defineModel<string | number>()
defineProps<{ field: PublicField }>()
</script>

<template>
  <Input
    v-model="model"
    type="number"
    :min="field.min"
    :max="field.max"
    :step="field.step ?? 'any'"
    :disabled="field.locked"
  />
</template>
