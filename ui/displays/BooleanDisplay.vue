<script setup lang="ts">
// Display des champs `boolean` — badge Oui/Non (i18n).
import { computed } from "vue"
import { Badge } from "@forge/primitives/badge"
import { useForgeT } from "@forge/i18n"

const props = defineProps<{ value: unknown }>()
const t = useForgeT()

const state = computed<boolean | null>(() => {
  if (props.value === true || props.value === "true" || props.value === 1) return true
  if (props.value === false || props.value === "false" || props.value === 0) return false
  return null
})
</script>

<template>
  <span v-if="state === null" class="text-sm text-muted-foreground">—</span>
  <Badge v-else :tone="state ? 'success' : 'muted'">
    {{ state ? t("boolean.yes") : t("boolean.no") }}
  </Badge>
</template>
