# Frontend kit

The `ui/` kit is Forge's Vue half: the **3 CRUD pages**, **composables**,
**primitives** (buttons, tables, dialogs…), the custom-component registries and
i18n. It is written for **Inertia + Vue 3** and ships **zero server code** (it
only imports constants from the engine).

## The Inertia entry

The engine renders pages named `forge/ResourceIndex|Show|Form`; your custom
pages have free names (`Dashboard`…). The dual resolver handles both:

```ts
import { FORGE_PAGE_NS } from "@/brand"

resolve: (name) => {
  const isForge = name.startsWith(`${FORGE_PAGE_NS}/`)
  const pages = isForge
    ? import.meta.glob("../forge/ui/pages/**/*.vue", { eager: true })
    : import.meta.glob("./pages/**/*.vue", { eager: true })
  const file = isForge ? name.slice(FORGE_PAGE_NS.length + 1) : name
  const key = Object.keys(pages).find((k) => k.endsWith(`/pages/${file}.vue`))
  if (!key) throw new Error(`Page not found: "${name}"`)
  return pages[key] as object
}
```

## Injecting your layout

The kit's pages render their content **inside your chrome** — provided by
injection when the app mounts:

```ts
import { FORGE_LAYOUT } from "@/layout"

app.provide(FORGE_LAYOUT, MyLayout)   // without it: minimal passthrough
```

Your layout receives the content in the default slot and reads the shared nav:

```vue
<script setup lang="ts">
import { usePage } from "@inertiajs/vue3"
import { navIcon } from "@/nav"

interface NavEntry { name: string; href: string; label: string; group: string; icon?: string; exact?: boolean }
const nav = computed(() => (usePage().props.forge as { nav: NavEntry[] })?.nav ?? [])
const active = (e: NavEntry) =>
  e.exact ? usePage().url === e.href : usePage().url.startsWith(e.href)
</script>

<template>
  <div class="flex min-h-screen">
    <aside><!-- group `nav` by .group, render navIcon(e.icon) + e.label --></aside>
    <main class="min-w-0 flex-1 p-6"><slot /></main>
  </div>
</template>
```

## The composables

| Composable | Role |
|---|---|
| `useForgeLayout()` | The injected layout (passthrough fallback). |
| `useForgePrefix()` | The CRUD prefix, read from props — never a hardcoded `/admin`. |
| `useForgeT()` | `t()` scoped to the kit's messages (`t("actions.edit")`). |
| `useResourceTable(name, initial)` | Full list state: debounced search, sorting, filters, pagination (all server-side through partial Inertia reloads) + persisted column hiding. |
| `useResourceForm(name, fields, row, mode, scope?)` | Inertia form for a resource (initial values, submit, errors). |

## Custom components (escape hatches)

**Field display / input** — register a component, reference it by name in the
field def:

```ts
import { registerDisplay } from "@/fields"
import { registerInput } from "@/inputs"
import RatingDisplay from "./RatingDisplay.vue"
import RatingInput from "./RatingInput.vue"

registerDisplay("rating", RatingDisplay)  // receives { field, value }
registerInput("rating", RatingInput)      // v-model + { field }
```

```ts
text("score", { display: "rating", input: "rating", editable: true })
```

**Nav icons** — the server sends a *name*, the frontend resolves it:

```ts
import { registerNavIcon } from "@/nav"
import { PhGauge } from "@phosphor-icons/vue"

registerNavIcon("gauge", PhGauge)
```

## The primitives

The kit exposes its primitives (`@/primitives/*`): `button`, `input`, `select`,
`table`, `card`, `badge`, `dialog`, `dropdown-menu`, `checkbox`, `switch`,
`textarea`, `tooltip`, `separator`, `scroll-area`, `sonner` (toasts)… Your
custom pages compose them to stay visually consistent with the CRUD — same
design tokens, same dark mode.

`OverflowRow` deserves a mention: a responsive "priority+" row that pushes
overflowing items into a "…" menu — the kit uses it for detail-page header
buttons and tabs.

## Using the kit without the engine?

Partially: primitives and composables work in any Vue/Inertia app, but the CRUD
pages consume the props shape the engine produces. The kit is designed as the
engine's frontend half — not as a general-purpose UI library.
