# Sidebar

Le système de sidebar shadcn-vue complet (collapsible, rail, mobile
off-canvas) — celui sur lequel le [shell par défaut](../guide/frontend) est
construit. Vous n'en avez besoin en direct que pour un **layout custom**.

```vue
<script setup lang="ts">
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger,
} from "@/primitives/sidebar"
</script>

<template>
  <SidebarProvider>
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader><!-- brand --></SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Général</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child :is-active="true" tooltip="Accueil">
                <a href="/">Accueil</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
    <SidebarInset>
      <header><SidebarTrigger /></header>
      <main><!-- contenu --></main>
    </SidebarInset>
  </SidebarProvider>
</template>
```

Points clés :

- `Sidebar` : `variant` (`sidebar`/`floating`/`inset`), `collapsible`
  (`offcanvas`/`icon`/`none`), `side`.
- `SidebarMenuButton` : `is-active`, `tooltip` (affiché replié), `as-child`.
- `useSidebar()` (dans le provider) : `setOpenMobile`, `toggleSidebar`, états.
- **Persistance** : l'état replié est écrit en cookie par la primitive, mais
  son défaut est figé au chargement du module — relisez le cookie à chaque
  montage et passez `:default-open` au provider (le shell le fait ; copiez ce
  pattern dans un layout custom).
- Beaucoup d'autres sous-composants (badge, action, sous-menus, skeleton…) —
  API complète : shadcn-vue.

Le branchement complet (nav `forge.nav`, brand, outlets) est illustré par
`components/AdminSidebar.vue` du kit — la meilleure référence pour le vôtre.
