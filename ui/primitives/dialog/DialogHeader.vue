<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@forge/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    data-slot="dialog-header"
    :class="cn('gap-1.5 flex flex-col', props.class)"
  >
    <slot />
  </div>
</template>
