<script setup lang="ts">
// Composant d'EXTENSION démo — monté dans l'outlet `header` du ForgeShell via
// installForgeExtensions (voir main.ts). Prouve le point d'ancrage : une vraie
// feature optionnelle (2FA, notifications…) se brancherait exactement pareil.
import { PhGithubLogo } from "@phosphor-icons/vue"
import { Button } from "@/primitives/button"
</script>

<template>
  <Button variant="ghost" size="icon-sm" as-child aria-label="GitHub">
    <a href="https://github.com/Nihilop/forge-admin" target="_blank" rel="noopener">
      <PhGithubLogo :size="17" />
    </a>
  </Button>
</template>
