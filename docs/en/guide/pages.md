# Pages: auto-generated vs custom

## CRUD pages are auto-generated

You **never** write them. Declaring a resource creates the list, detail and
form pages — see [Resources](resources).

## Custom pages are yours

For anything that isn't CRUD (dashboard, monitoring, help page…), you write
**the route and the component**; `definePage` only adds the entry to Forge's
**sidebar** (unified menu).

### 1. Declare the menu entry (server)

```ts
import { definePage } from "forge/engine"

definePage({
  name: "dashboard",
  href: "/",                 // YOUR route (Forge does not render it)
  label: "Overview",
  nav: { group: "General", icon: "gauge", order: 0 },
  permission: "dashboard.read",  // hides the entry without this permission
  exact: true,               // link active on EXACT URL match
})
```

| Option | Role |
|---|---|
| `name` | Unique id. |
| `href` | **Your** route. |
| `label` / `nav` | Label + sidebar position (`group`, `icon`, `order`). |
| `permission` | Permission required to see the entry. |
| `exact` | Active on exact match (otherwise prefix) — essential for `/`. |

### 2. Write the route (app)

```ts
admin.app.get("/", async (c) =>
  admin.render(c, "Dashboard", { stats: await stats() }))
```

`admin.render` renders one of **your** app's pages — the frontend resolver will
look it up outside the Forge namespace (see [Frontend kit](frontend)).

### 3. Write the component

```vue
<!-- src/pages/Dashboard.vue -->
<script setup lang="ts">
import { Link } from "@inertiajs/vue3"
import { Card, CardContent } from "@forge/primitives/card"
import { useForgeLayout } from "@forge/layout"
import { useForgePrefix } from "@forge/prefix"

const Layout = useForgeLayout()      // your chrome, injected
const prefix = useForgePrefix()      // never a hardcoded "/admin"

defineProps<{ stats: { orders: number; pending: number } }>()
</script>

<template>
  <component :is="Layout">
    <h1 class="text-2xl">Overview</h1>
    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      <Card>
        <CardContent>
          <p class="text-xs text-muted-foreground">Orders</p>
          <p class="mt-1 text-3xl font-semibold tabular-nums">{{ stats.orders }}</p>
          <Link :href="`${prefix}/orders`" class="text-xs hover:underline">View list</Link>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <p class="text-xs text-muted-foreground">Pending</p>
          <p class="mt-1 text-3xl font-semibold tabular-nums">{{ stats.pending }}</p>
          <!-- Deep-link to the FILTERED list (server-side faceted filters) -->
          <Link :href="`${prefix}/orders?f_status=pending`" class="text-xs hover:underline">View</Link>
        </CardContent>
      </Card>
    </div>
  </component>
</template>
```

::: tip Deep-links into lists
List state lives in the URL: `?q=…` (search), `?f_<field>=<value>` (faceted
filter), `?sort=<field>&dir=asc|desc`, `?page=…&per=…`. Your custom pages can
point straight to a filtered view.
:::

## The unified menu

The sidebar is the union: **resource** entries (those with `nav`) ⊕
**`definePage`** entries — sorted by `order`, grouped by `group`, filtered by
permission. Server-side, `forgeNav()` generates it; the facade shares it with
every page as the `forge.nav` prop, and your layout renders it however you want
(see [Frontend kit](frontend)).
