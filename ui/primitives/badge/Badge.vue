<script setup lang="ts">
// Badge « tone » du kit — teinte sémantique douce (statuts, compteurs, chips).
// C'est le rendu des champs `badge` du CRUD, exposé en primitive.
import { badgeToneClasses, type BadgeTone } from "./tones"

const props = withDefaults(defineProps<{ tone?: BadgeTone }>(), { tone: "muted" })
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
    :class="badgeToneClasses[props.tone]"
  >
    <slot />
  </span>
</template>
