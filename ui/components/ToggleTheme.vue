<script setup lang="ts">
// Toggle clair/sombre du shell (persisté — voir shell/theme.ts).
import { PhMoon, PhSun } from "@phosphor-icons/vue"
import { Button } from "@forge/primitives/button"
import { useForgeShellOptions } from "../shell/options"
import { useForgeTheme } from "../shell/theme"

const options = useForgeShellOptions()
const { dark, toggle: toggleTheme } = useForgeTheme()
</script>

<template>
  <Button
    v-if="options.themeToggle"
    variant="ghost"
    size="icon-sm"
    aria-label="Theme"
    @click="toggleTheme"
  >
    <PhMoon v-if="!dark" :size="17" />
    <PhSun v-else :size="17" />
  </Button>
</template>
