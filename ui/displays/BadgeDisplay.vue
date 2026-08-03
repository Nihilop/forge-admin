<script setup lang="ts">
// Display des champs `badge` — rend la primitive Badge du kit avec le tone de
// l'option correspondante (source unique du rendu badge).
import { computed } from "vue"
import type { PublicField } from "../fields"
import { Badge, type BadgeTone } from "@/primitives/badge"

const props = defineProps<{ value: unknown; field: PublicField }>()

const opt = computed(() => props.field.options?.find((o) => o.value === String(props.value)))
</script>

<template>
  <Badge :tone="(opt?.tone as BadgeTone | undefined) ?? 'muted'">
    {{ opt?.label ?? value ?? "—" }}
  </Badge>
</template>
