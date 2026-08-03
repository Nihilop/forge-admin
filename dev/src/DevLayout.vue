<script setup lang="ts">
// Layout de l'APP exemple : une sidebar alimentée par la nav Forge (`forge.nav`,
// partagée par le serveur) — menu UNIFIÉ resources ⊕ pages custom (dashboard).
// Un hôte réel fournit le sien pareil, via provide(FORGE_LAYOUT, …).
import { computed } from "vue"
import { Link, usePage } from "@inertiajs/vue3"
import { useI18n } from "vue-i18n"
import { FORGE_STORAGE_NS } from "@/brand"
import { navIcon } from "@/nav"

const { locale } = useI18n()
function setLocale(l: string) {
  locale.value = l
  localStorage.setItem(`${FORGE_STORAGE_NS}:locale`, l)
}

interface NavEntry {
  name: string
  href: string
  label: string
  group: string
  icon?: string
  /** Actif en match EXACT (ex. le dashboard sur "/"). */
  exact?: boolean
}

const nav = computed(() => (usePage().props.forge as { nav: NavEntry[] } | undefined)?.nav ?? [])

// Regroupe la liste plate par `group`.
const groups = computed(() => {
  const map = new Map<string, NavEntry[]>()
  for (const e of nav.value) {
    if (!map.has(e.group)) map.set(e.group, [])
    map.get(e.group)!.push(e)
  }
  return [...map.entries()].map(([label, items]) => ({ label, items }))
})

const active = (e: NavEntry) => e.exact ? usePage().url === e.href : usePage().url.startsWith(e.href)
</script>

<template>
  <div class="flex min-h-screen">
    <aside class="flex w-60 shrink-0 flex-col border-r bg-sidebar p-4">
      <div class="mb-6 flex items-center gap-2">
        <span class="grid size-7 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">F</span>
        <span class="font-medium">Forge <span class="text-xs text-muted-foreground">dev</span></span>
      </div>
      <nav class="flex flex-col gap-0.5">
        <template v-for="g in groups" :key="g.label">
          <p class="px-2 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {{ g.label }}
          </p>
          <Link
            v-for="item in g.items"
            :key="item.href"
            :href="item.href"
            class="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors"
            :class="active(item)
              ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
              : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'"
          >
            <component :is="navIcon(item.icon)" :size="15" class="shrink-0 opacity-70" />
            {{ item.label }}
          </Link>
        </template>
      </nav>

      <!-- Sélecteur de langue (démo i18n) -->
      <div class="mt-auto flex gap-1 pt-4">
        <button
          v-for="l in ['fr', 'en']"
          :key="l"
          type="button"
          class="rounded px-2 py-1 text-xs uppercase transition-colors"
          :class="locale === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
          @click="setLocale(l)"
        >
          {{ l }}
        </button>
      </div>
    </aside>
    <main class="min-w-0 flex-1 p-6"><slot /></main>
  </div>
</template>
