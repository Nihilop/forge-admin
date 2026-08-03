<script setup lang="ts">
// Layout PAR DÉFAUT de Forge (passthrough minimal). Le consommateur fournit le
// sien via provide(FORGE_LAYOUT, …) ; à défaut, on rend le contenu tel quel.
</script>

<template>
  <div class="forge-layout min-h-screen p-6">
    <slot />
  </div>
</template>
