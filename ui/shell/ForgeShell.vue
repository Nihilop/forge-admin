<script setup lang="ts">
// Forge · SHELL PAR DÉFAUT — le layout clé en main du kit, construit sur la
// primitive Sidebar de shadcn-vue (collapsible, mobile off-canvas, rail).
// La sidebar vit dans components/AdminSidebar.vue ; la topbar expose les
// outlets d'extension (`header:start`, `header:end`) + langue et thème.
// C'est le fallback de FORGE_LAYOUT : un hôte peut toujours fournir son
// propre chrome via provide(FORGE_LAYOUT, …).
import { Separator } from "@forge/primitives/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@forge/primitives/sidebar"
import { SIDEBAR_COOKIE_NAME } from "@forge/primitives/sidebar/utils"
import AdminSidebar from "../components/AdminSidebar.vue"
import ToggleLang from "../components/ToggleLang.vue"
import ToggleTheme from "../components/ToggleTheme.vue"
import ForgeOutlet from "./ForgeOutlet.vue"

// État replié/déplié PERSISTANT : la primitive écrit le cookie à chaque toggle
// mais son défaut est figé au chargement du module — or Inertia REMONTE le
// layout à chaque navigation. On relit donc le cookie à CHAQUE setup.
const sidebarDefaultOpen = typeof document === "undefined"
  ? true
  : !document.cookie.includes(`${SIDEBAR_COOKIE_NAME}=false`)
</script>

<template>
  <SidebarProvider :default-open="sidebarDefaultOpen">
    <AdminSidebar />
    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center justify-between gap-2">
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator
            orientation="vertical"
            class="mr-2 data-[orientation=vertical]:h-4 my-auto"
          />
          <!-- Slot PAR PAGE (ex. lien retour du form), puis outlet GLOBAL (extensions) -->
          <slot name="header-start" />
          <ForgeOutlet name="header:start" />
        </div>
        <div class="flex items-center gap-1 px-4">
          <slot name="header-end" />
          <ForgeOutlet name="header:end" />
          <ToggleLang />
          <ToggleTheme />
        </div>
      </header>
      <div class="flex flex-col gap-4 p-4 pt-0 flex-1 min-h-0 overflow-y-auto">
        <slot />
      </div>
      <!-- Outlet des SURCOUCHES globales (dialogs d'extensions : élévation…) -->
      <ForgeOutlet name="overlays" />
    </SidebarInset>
  </SidebarProvider>
</template>
