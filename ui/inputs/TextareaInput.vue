<script setup lang="ts">
import { Textarea } from "@/primitives/textarea"
import type { PublicField } from "../fields"

const model = defineModel<string>()
defineProps<{ field: PublicField }>()
</script>

<template>
  <Textarea v-model="model" :disabled="field.locked" rows="10" class="min-h-40 font-mono text-sm" />
</template>
