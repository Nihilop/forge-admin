<script setup lang="ts">
import { computed } from "vue"

// La valeur est un epoch en millisecondes (renvoyé en float8 par le moteur).
const props = defineProps<{ value: unknown }>()

const formatted = computed(() => {
  const ms = Number(props.value)
  if (!props.value || Number.isNaN(ms)) return "—"
  return new Date(ms).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
})
</script>

<template>
  <span class="text-sm text-muted-foreground">{{ formatted }}</span>
</template>
