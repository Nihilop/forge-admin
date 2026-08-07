<script setup lang="ts">
// Display des champs `json` — pretty-print monospace (chaîne JSON ou objet
// déjà désérialisé par le driver). Pensé pour `wide: true` sur la fiche.
import { computed } from "vue"

const props = defineProps<{ value: unknown }>()

const pretty = computed(() => {
  if (props.value == null || props.value === "") return null
  try {
    const obj = typeof props.value === "string" ? JSON.parse(props.value) : props.value
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(props.value)
  }
})
</script>

<template>
  <span v-if="pretty === null" class="text-sm text-muted-foreground">—</span>
  <pre
    v-else
    class="max-h-64 overflow-auto rounded-md bg-muted/50 px-3 py-2 font-mono text-xs leading-relaxed"
  >{{ pretty }}</pre>
</template>
