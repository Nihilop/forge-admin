<script setup lang="ts">
import { Input } from "@/primitives/input"
import type { PublicField } from "../fields"

const model = defineModel<string>()
defineProps<{ field: PublicField }>()
</script>

<template>
  <Input
    v-model="model"
    :type="field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'"
    :disabled="field.locked"
  />
</template>
