<script setup lang="ts">
// Sélecteur de langue du shell (affiché si plusieurs locales i18n, persisté).
import { useI18n } from "vue-i18n"
import { PhTranslate } from "@phosphor-icons/vue"
import { Button } from "@forge/primitives/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@forge/primitives/dropdown-menu"
import { FORGE_STORAGE_NS } from "@forge/brand"
import { useForgeShellOptions } from "../shell/options"

const options = useForgeShellOptions()
const { locale, availableLocales } = useI18n()

function setLocale(l: string) {
  locale.value = l
  try {
    localStorage.setItem(`${FORGE_STORAGE_NS}:locale`, l)
  } catch { /* stockage indisponible */ }
}
</script>

<template>
  <DropdownMenu v-if="options.localeSwitcher && availableLocales.length > 1">
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon-sm" aria-label="Language">
        <PhTranslate :size="17" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem
        v-for="l in availableLocales"
        :key="l"
        :class="locale === l ? 'font-medium text-foreground' : ''"
        @click="setLocale(l)"
      >
        <span class="uppercase">{{ l }}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
