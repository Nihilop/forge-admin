# Frontend kit

The `ui/` kit is Forge's Vue half: the **3 CRUD pages**, **composables**,
**primitives** (buttons, tables, dialogs…), the custom-component registries and
i18n. It is written for **Inertia + Vue 3** and ships **zero server code** (it
only imports constants from the engine).

## The Inertia entry

The engine renders pages named `forge/ResourceIndex|Show|Form`; your custom
pages have free names (`Dashboard`…). The dual resolver handles both:

```ts
import { FORGE_PAGE_NS } from "@forge/brand"

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

## The default shell (turnkey)

With zero configuration, pages render inside **`ForgeShell`**: a sidebar
generated from the unified nav (groups, icons, active states), a topbar,
persisted light/dark theme, a language switcher, responsive (mobile drawer) —
and **outlets** where extensions plug in.

Customization through options:

```ts
import { FORGE_SHELL_OPTIONS } from "@forge/shell/options"

app.provide(FORGE_SHELL_OPTIONS, {
  title: "My back-office",
  subtitle: "prod",
  // logo: MyLogo,           // component, replaces the initial-letter chip
  // homeHref: "/dashboard",
  // themeToggle: false,
  // localeSwitcher: false,
})
```

## Replacing the shell (escape hatch)

The shell is just a **default**. For your own chrome, inject it — the kit's
pages will render their content inside:

```ts
import { FORGE_LAYOUT, ForgeBareLayout } from "@forge/layout"

app.provide(FORGE_LAYOUT, MyLayout)         // your full chrome
// or: app.provide(FORGE_LAYOUT, ForgeBareLayout)  // no chrome (passthrough)
```

Your layout receives the content in the default slot and reads the shared nav
(`usePage().props.forge.nav` — group by `.group`, resolve icons with
`navIcon()`, honor `exact` for active states).

## UI extensions

The kit ships **no optional feature** (2FA, notifications, user menu…) — it
exposes anchor points. An extension bundles them:

```ts
import { installForgeExtensions } from "@forge/extensions"

installForgeExtensions(app, [
  {
    name: "two-factor",
    outlets: { "sidebar:footer": TwoFactorBadge },  // mounted in the shell
    inputs: { otp: OtpInput },                       // custom field input
    icons: { shield: PhShieldCheck },
    messages: { en: { twoFactor: { title: "Two-factor authentication" } } },
    setup: ({ app }) => { /* plugins, provide, directives… */ },
  },
], { i18n })   // before app.mount()
```

Shell outlets: `header:start` (topbar, after the trigger), `header:end`
(topbar, right side) and `sidebar:footer` (bottom of the sidebar). The
**server** half of an extension (routes, resources, pages) goes through the
[facade](facade)'s `extensions` option.

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
import { registerDisplay } from "@forge/fields"
import { registerInput } from "@forge/inputs"
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
import { registerNavIcon } from "@forge/nav"
import { PhGauge } from "@phosphor-icons/vue"

registerNavIcon("gauge", PhGauge)
```

## Theme & styles

The kit ships **no precompiled CSS**: it provides `ui/styles/forge.css`
(Tailwind v4 + an `@source` directive pointing at the kit's sources + the
"Clay" light/dark design system + fonts) and **your project's build**
generates the final stylesheet — shared purge, tokens shared between the CRUD
and your custom pages, native HMR.

```css
/* The default theme, in one line: */
@import "@streemkit/forge/ui/styles/forge.css";

/* Customize: override tokens AFTER the import. */
:root { --primary: #4f46e5; --radius: 0.5rem; }
.dark { --primary: #6366f1; }
```

Fully custom theme: skip `forge.css` and provide your own tokens (same
variable names) + `@import "tailwindcss"` + `@source` pointing at the kit.

## The primitives

The kit exposes all of its primitives (`@forge/primitives/*`) — button, table,
card, badge, dialogs, sidebar… Your custom pages compose them to stay visually
consistent with the CRUD: same design tokens, same dark mode, zero CSS to
write. **Every component has its own page** in the
[Components](../components/) section, with import, example and API.

## Using the kit without the engine?

Partially: primitives and composables work in any Vue/Inertia app, but the CRUD
pages consume the props shape the engine produces. The kit is designed as the
engine's frontend half — not as a general-purpose UI library.
