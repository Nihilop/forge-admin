<script setup lang="ts">
defineProps<{ value: unknown }>()
</script>

<template>
  <span class="text-sm">{{ value ?? "—" }}</span>
</template>
