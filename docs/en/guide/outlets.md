# Outlets

An **outlet** is a named anchor point in the layout where components register
**at boot** — the mechanism that lets [extensions](frontend#ui-extensions)
(and your app) inject UI into the shell **without modifying it**: user menu,
2FA badge, environment indicator, notifications…

## Outlets provided by the shell

| Outlet | Location |
|---|---|
| `header:start` | Topbar, right of the sidebar trigger (after the [per-page slot](#per-page-slots-vs-outlets)). |
| `header:end` | Topbar, right side (before the language/theme toggles). |
| `sidebar:footer` | Bottom of the sidebar. |

## Registering a component

Two ways, always **before `app.mount()`**:

```ts
// 1. Through an extension (recommended — grouped with the rest of the feature):
installForgeExtensions(app, [
  { name: "env-indicator", outlets: { "header:end": EnvBadge } },
], { i18n })

// 2. Directly:
import { registerShellItem } from "@/shell/registry"
registerShellItem("sidebar:footer", UserMenu)
```

Several components can target the same outlet: they render in **registration
order**.

## Creating your own outlets

`ForgeOutlet` is a public component — place it anywhere, with any name. Useful
in a **custom layout** (to stay compatible with extensions) as well as in the
default shell if you extend it:

```vue
<script setup lang="ts">
import ForgeOutlet from "@/shell/ForgeOutlet.vue"
</script>

<template>
  <footer>
    <ForgeOutlet name="footer:legal" />
  </footer>
</template>
```

::: tip Naming convention
`zone:position` (`header:end`, `sidebar:footer`, `footer:legal`…). Names are
free-form, but a community extension will target the **standard** outlets from
the table above — if your custom layout exposes them, those extensions work in
your app without adaptation.
:::

## Per-page slots vs outlets

Two complementary mechanisms — don't mix them up:

| | Slot (`#header-start`) | Outlet (`header:start`) |
|---|---|---|
| Scope | **Per page** — passed by the page rendering the layout | **Global** — registered once at boot |
| Typical use | Back link, contextual title | User menu, 2FA, notifications |
| Access to page props | Yes (it's the page's template) | No (standalone component) |
| Naming | kebab (`header-start` — `:` is reserved by `v-slot`) | `zone:position` |

The shell renders the slot **before** the outlet of the same zone. See
[Custom pages](pages) for slot usage.
