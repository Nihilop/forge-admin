<script setup lang="ts">
import { computed } from "vue"
import type { PublicField } from "../fields"

const props = defineProps<{ value: unknown; field: PublicField }>()

const opt = computed(() => props.field.options?.find((o) => o.value === String(props.value)))

const TONE: Record<string, string> = {
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/12 text-destructive",
  primary: "bg-primary/12 text-primary",
  muted: "bg-muted text-muted-foreground",
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
    :class="TONE[opt?.tone ?? 'muted']"
  >
    {{ opt?.label ?? value ?? "—" }}
  </span>
</template>
