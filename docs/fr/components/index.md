# Composants

Le kit expose **toutes ses primitives UI** — les mêmes que celles qui
construisent le CRUD et le shell. C'est la promesse « pages custom cohérentes » :
vous composez vos dashboards et écrans métier avec ces briques, et tout reste
visuellement homogène (mêmes tokens, même dark mode, même densité) **sans
écrire de CSS**.

## Importer

Chaque primitive s'importe depuis son dossier :

```ts
import { Button } from "@/primitives/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/primitives/card"
import { confirmAction } from "@/confirm"
```

(`@` = la racine du kit — l'alias configuré dans votre Vite/tsconfig.)

## Le catalogue

| Famille | Composants |
|---|---|
| **Actions** | [Button](button) · [DropdownMenu](dropdown-menu) |
| **Formulaires** | [Input](input) · [Textarea](textarea) · [Select](select) · [Checkbox](checkbox) · [Switch](switch) · [Label](label) |
| **Affichage** | [Badge](badge) · [Card](card) · [Table](table) · [Skeleton](skeleton) · [Separator](separator) · [Tooltip](tooltip) |
| **Surcouches** | [Dialog](dialog) · [AlertDialog](alert-dialog) · [Sheet](sheet) · [Sonner (toasts)](sonner) |
| **Navigation** | [Sidebar](sidebar) · [Breadcrumb](breadcrumb) |
| **Kit** | [ConfirmDialog / confirmAction](confirm-dialog) · [OverflowRow](overflow-row) |

Les primitives viennent de **shadcn-vue** (reka-ui), vendorées dans le kit et
thémées par le [design system](../guide/frontend#theme--styles) — leur API
détaillée est celle de shadcn-vue. Les composants « Kit » sont propres à Forge.

## Ajouter une primitive manquante

Le CLI shadcn-vue est configuré pour écrire dans `primitives/` :

```bash
yes N | npx shadcn-vue@latest add <composant>
```

(`yes N` = ne jamais écraser les primitives existantes, certaines sont
customisées.)
