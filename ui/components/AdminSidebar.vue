<script setup lang="ts">
// Sidebar de l'admin — construite sur la primitive Sidebar de shadcn-vue
// (collapsible, mobile off-canvas via Sheet, rail). Contenu : brand (options du
// shell), nav UNIFIÉE générée par le serveur (`forge.nav`), outlet d'extensions
// en pied (`sidebar:footer`).
import { computed } from "vue"
import { Link, usePage } from "@inertiajs/vue3"
import type { SidebarProps } from "@forge/primitives/sidebar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@forge/primitives/sidebar"
import { type ForgeNavEntry, navIcon } from "@forge/nav"
import { useForgeShellOptions } from "../shell/options"
import ForgeOutlet from "../shell/ForgeOutlet.vue"

const props = withDefaults(defineProps<SidebarProps>(), {
  variant: "inset",
  collapsible: "icon",
})

const options = useForgeShellOptions()
const page = usePage()
const { setOpenMobile } = useSidebar()

const nav = computed(() => ((page.props.forge as { nav?: ForgeNavEntry[] } | undefined)?.nav ?? []))

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
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <Link :href="options.homeHref" @click="setOpenMobile(false)">
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
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup v-for="g in groups" :key="g.label">
        <SidebarGroupLabel>{{ g.label }}</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem v-for="item in g.items" :key="item.href">
            <SidebarMenuButton as-child :is-active="active(item)" :tooltip="item.label">
              <Link :href="item.href" @click="setOpenMobile(false)">
                <component :is="navIcon(item.icon)" />
                <span>{{ item.label }}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <ForgeOutlet name="sidebar:footer" />
    </SidebarFooter>
  </Sidebar>
</template>
