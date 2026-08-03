# Components

The kit exposes **all of its UI primitives** — the same ones that build the
CRUD and the shell. That's the "coherent custom pages" promise: you compose
your dashboards and business screens with these blocks, and everything stays
visually consistent (same tokens, same dark mode, same density) **without
writing CSS**.

## Importing

Each primitive is imported from its folder:

```ts
import { Button } from "@forge/primitives/button"
import { Card, CardContent, CardHeader, CardTitle } from "@forge/primitives/card"
import { confirmAction } from "@forge/confirm"
```

(`@` = the kit root — the alias configured in your Vite/tsconfig.)

## The catalog

| Family | Components |
|---|---|
| **Actions** | [Button](button) · [DropdownMenu](dropdown-menu) |
| **Forms** | [Input](input) · [Textarea](textarea) · [Select](select) · [Checkbox](checkbox) · [Switch](switch) · [Label](label) |
| **Display** | [Badge](badge) · [Card](card) · [Table](table) · [Skeleton](skeleton) · [Separator](separator) · [Tooltip](tooltip) |
| **Overlays** | [Dialog](dialog) · [AlertDialog](alert-dialog) · [Sheet](sheet) · [Sonner (toasts)](sonner) |
| **Navigation** | [Sidebar](sidebar) · [Breadcrumb](breadcrumb) |
| **Kit** | [ConfirmDialog / confirmAction](confirm-dialog) · [OverflowRow](overflow-row) |

Primitives come from **shadcn-vue** (reka-ui), vendored into the kit and themed
by the [design system](../guide/frontend#theme--styles) — their detailed API is
shadcn-vue's. The "Kit" components are Forge-specific.

## Adding a missing primitive

The shadcn-vue CLI is configured to write into `primitives/`:

```bash
yes N | npx shadcn-vue@latest add <component>
```

(`yes N` = never overwrite existing primitives, some are customized.)
