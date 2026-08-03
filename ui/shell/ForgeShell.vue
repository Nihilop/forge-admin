<script setup lang="ts">
// Forge · SHELL PAR DÉFAUT — le layout clé en main du kit, construit sur la
// primitive Sidebar de shadcn-vue (collapsible, mobile off-canvas, rail).
// La sidebar vit dans components/AdminSidebar.vue ; la topbar expose les
// outlets d'extension (`header:start`, `header:end`) + langue et thème.
// C'est le fallback de FORGE_LAYOUT : un hôte peut toujours fournir son
// propre chrome via provide(FORGE_LAYOUT, …).
import { Separator } from "@/primitives/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/primitives/sidebar"
import AdminSidebar from "../components/AdminSidebar.vue"
import ToggleLang from "../components/ToggleLang.vue"
import ToggleTheme from "../components/ToggleTheme.vue"
import ForgeOutlet from "./ForgeOutlet.vue"
</script>

<template>
  <SidebarProvider>
    <AdminSidebar />
    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center justify-between gap-2">
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator
            orientation="vertical"
            class="mr-2 data-[orientation=vertical]:h-4 my-auto"
          />
          <ForgeOutlet name="header:start" />
        </div>
        <div class="flex items-center gap-1 px-4">
          <ForgeOutlet name="header:end" />
          <ToggleLang />
          <ToggleTheme />
        </div>
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
