<script setup lang="ts">
// Saisie des champs `boolean` — Switch du kit. Normalise les valeurs venues de
// la row ("true"/"false", null…) en vrai booléen dès la première interaction.
import { computed } from "vue"
import { Switch } from "@forge/primitives/switch"
import { useForgeT } from "@forge/i18n"
import type { PublicField } from "../fields"

const model = defineModel<unknown>()
defineProps<{ field: PublicField }>()
const t = useForgeT()

const checked = computed({
  get: () => model.value === true || model.value === "true" || model.value === 1,
  set: (v: boolean) => (model.value = v),
})
</script>

<template>
  <label class="flex h-9 items-center gap-2">
    <Switch v-model="checked" :disabled="field.locked" />
    <span class="text-sm text-muted-foreground">
      {{ checked ? t("boolean.yes") : t("boolean.no") }}
    </span>
  </label>
</template>
