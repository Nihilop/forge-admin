<script setup lang="ts">
// Forge · SHELL PAR DÉFAUT — le layout clé en main du kit. Sidebar générée
// depuis la nav unifiée (`forge.nav`, partagée par le serveur), topbar avec
// outlets d'extension, thème clair/sombre, sélecteur de langue, responsive
// (drawer sous lg). C'est le fallback de FORGE_LAYOUT : un hôte peut toujours
// fournir son propre chrome via provide(FORGE_LAYOUT, …).
import { computed, ref } from "vue"
import { Link, usePage } from "@inertiajs/vue3"
import { useI18n } from "vue-i18n"
import { PhList, PhMoon, PhSun, PhTranslate } from "@phosphor-icons/vue"
import { Button } from "@/primitives/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/primitives/dropdown-menu"
import { navIcon, type ForgeNavEntry } from "@/nav"
import { FORGE_STORAGE_NS } from "@/brand"
import { useForgeShellOptions } from "./options"
import { useForgeTheme } from "./theme"
import ForgeOutlet from "./ForgeOutlet.vue"

const options = useForgeShellOptions()
const { dark, toggle: toggleTheme } = useForgeTheme()
const { locale, availableLocales } = useI18n()

const page = usePage()
const nav = computed(() =>
  ((page.props.forge as { nav?: ForgeNavEntry[] } | undefined)?.nav ?? [])
)

// Regroupe la liste plate par `group` (l'ordre global vient du serveur).
const groups = computed(() => {
  const map = new Map<string, ForgeNavEntry[]>()
  for (const e of nav.value) {
    if (!map.has(e.group)) map.set(e.group, [])
    map.get(e.group)!.push(e)
  }
  return [...map.entries()].map(([label, items]) => ({ label, items }))
})

const active = (e: ForgeNavEntry) =>
  e.exact ? page.url === e.href : page.url.startsWith(e.href)

// Drawer mobile (sous lg). Fermé à chaque navigation.
const open = ref(false)
function navigate() {
  open.value = false
}

function setLocale(l: string) {
  locale.value = l
  try {
    localStorage.setItem(`${FORGE_STORAGE_NS}:locale`, l)
  } catch { /* stockage indisponible */ }
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Backdrop du drawer mobile -->
    <div
      v-if="open"
      class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
      @click="open = false"
    />

    <!-- Sidebar : fixe en desktop, drawer sous lg -->
    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0"
      :class="open ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Brand -->
      <Link
        :href="options.homeHref"
        class="flex items-center gap-2.5 px-4 pt-4 pb-2"
        @click="navigate"
      >
        <component :is="options.logo" v-if="options.logo" class="size-8 shrink-0" />
        <span
          v-else
          class="grid size-8 shrink-0 place-items-center rounded-lg bg-primary font-heading text-sm font-bold text-primary-foreground"
        >
          {{ options.title.charAt(0).toUpperCase() }}
        </span>
        <span class="truncate font-heading font-semibold">
          {{ options.title }}
          <span v-if="options.subtitle" class="ml-1 text-xs font-normal text-muted-foreground">
            {{ options.subtitle }}
          </span>
        </span>
      </Link>

      <!-- Navigation -->
      <nav class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
        <template v-for="g in groups" :key="g.label">
          <p class="px-2 pt-4 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase first:pt-1">
            {{ g.label }}
          </p>
          <Link
            v-for="item in g.items"
            :key="item.href"
            :href="item.href"
            class="inline-flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors"
            :class="active(item)
              ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
              : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'"
            @click="navigate"
          >
            <component
              :is="navIcon(item.icon)"
              :size="16"
              class="shrink-0"
              :class="active(item) ? 'text-primary' : 'opacity-60'"
            />
            <span class="truncate">{{ item.label }}</span>
          </Link>
        </template>
      </nav>

      <!-- Pied de sidebar : outlet d'extensions (menu user, 2FA, etc.) -->
      <div class="flex flex-col gap-1 border-t px-3 py-3">
        <ForgeOutlet name="sidebar:footer" />
      </div>
    </aside>

    <!-- Colonne contenu -->
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="sticky top-0 z-30 flex items-center gap-2 border-b bg-background/70 px-4 py-2 backdrop-blur-md lg:px-6">
        <Button
          variant="ghost"
          size="icon-sm"
          class="lg:hidden"
          aria-label="Menu"
          @click="open = !open"
        >
          <PhList :size="18" />
        </Button>

        <div class="flex-1" />

        <!-- Outlet d'extensions de la topbar -->
        <ForgeOutlet name="header" />

        <!-- Sélecteur de langue (si plusieurs locales) -->
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

        <!-- Thème clair/sombre -->
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
      </header>

      <main class="min-w-0 flex-1 p-4 lg:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
