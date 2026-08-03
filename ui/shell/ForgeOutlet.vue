<script setup lang="ts">
// Point d'ancrage nommé du shell : rend TOUS les composants enregistrés pour
// cet outlet (via registerShellItem / installForgeExtensions). Vide par défaut.
import { shellItems } from "./registry"

const props = defineProps<{ name: string }>()
const items = shellItems(props.name) // enregistrés au boot, avant mount
</script>

<template>
  <component :is="c" v-for="(c, i) in items" :key="i" />
</template>
