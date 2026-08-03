# Sidebar

The full shadcn-vue sidebar system (collapsible, rail, mobile off-canvas) —
the one the [default shell](../guide/frontend) is built on. You only need it
directly for a **custom layout**.

```vue
<script setup lang="ts">
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger,
} from "@forge/primitives/sidebar"
</script>

<template>
  <SidebarProvider>
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader><!-- brand --></SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child :is-active="true" tooltip="Home">
                <a href="/">Home</a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
    <SidebarInset>
      <header><SidebarTrigger /></header>
      <main><!-- content --></main>
    </SidebarInset>
  </SidebarProvider>
</template>
```

Key points:

- `Sidebar`: `variant` (`sidebar`/`floating`/`inset`), `collapsible`
  (`offcanvas`/`icon`/`none`), `side`.
- `SidebarMenuButton`: `is-active`, `tooltip` (shown collapsed), `as-child`.
- `useSidebar()` (inside the provider): `setOpenMobile`, `toggleSidebar`,
  states.
- **Persistence**: the collapsed state is written to a cookie by the
  primitive, but its default is frozen at module load — re-read the cookie on
  every mount and pass `:default-open` to the provider (the shell does; copy
  that pattern in a custom layout).
- Many more sub-components (badge, action, submenus, skeleton…) — full API:
  shadcn-vue.

The complete wiring (nav from `forge.nav`, brand, outlets) is illustrated by
the kit's `components/AdminSidebar.vue` — the best reference for yours.
