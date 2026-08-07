<script setup lang="ts">
// Display des champs `datetime` — accepte un ISO-8601 (écrit par le moteur),
// un epoch-ms ou un Date sérialisé, et formate date + heure en locale.
import { computed } from "vue"

const props = defineProps<{ value: unknown }>()

const formatted = computed(() => {
  if (props.value == null || props.value === "") return "—"
  const raw = props.value
  const d = typeof raw === "number" || /^\d+$/.test(String(raw))
    ? new Date(Number(raw))
    : new Date(String(raw))
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
})
</script>

<template>
  <span class="text-sm text-muted-foreground">{{ formatted }}</span>
</template>
