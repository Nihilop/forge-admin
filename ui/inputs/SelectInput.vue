<script setup lang="ts">
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/primitives/select"
import type { PublicField } from "../fields"

const model = defineModel<string>()
defineProps<{ field: PublicField }>()
</script>

<template>
  <Select v-model="model" :disabled="field.locked">
    <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem v-for="o in field.options" :key="o.value" :value="o.value">{{ o.label }}</SelectItem>
    </SelectContent>
  </Select>
</template>
