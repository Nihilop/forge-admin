<script setup lang="ts">
// Bouton de déconnexion — monté dans l'outlet `sidebar:footer` du shell via
// installForgeExtensions (main.ts). POST /logout du module d'auth builtin.
import { router } from "@inertiajs/vue3"
import { PhSignOut } from "@phosphor-icons/vue"
import { Button } from "@forge/primitives/button"
</script>

<template>
  <Button
    variant="ghost"
    size="sm"
    class="w-full justify-start gap-2 text-muted-foreground"
    @click="router.post('/logout')"
  >
    <PhSignOut :size="16" /> Déconnexion
  </Button>
</template>
