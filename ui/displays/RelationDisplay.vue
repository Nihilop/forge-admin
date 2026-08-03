<script setup lang="ts">
import { computed } from "vue"
import { Link } from "@inertiajs/vue3"
import type { PublicField } from "../fields"
import { useForgePrefix } from "../prefix"
const prefix = useForgePrefix()

// value = { id, label } | null (belongsTo, résolu par le moteur).
const props = defineProps<{ value: unknown; field: PublicField }>()

const rel = computed(() => props.value as { id?: number | string | null; label?: string | null } | null)
</script>

<template>
  <Link
    v-if="rel && rel.id != null && field.relation"
    :href="`${prefix}/${field.relation.resource}/${rel.id}`"
    class="text-sm hover:underline"
    @click.stop
  >
    {{ rel.label ?? rel.id }}
  </Link>
  <span v-else class="text-sm text-muted-foreground">—</span>
</template>
