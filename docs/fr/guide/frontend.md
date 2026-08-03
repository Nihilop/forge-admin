# Kit frontend

Le kit `ui/` est la moitié Vue de Forge : les **3 pages CRUD**, des
**composables**, des **primitives** (boutons, tables, dialogs…), les registres
de composants custom et l'i18n. Il est écrit pour **Inertia + Vue 3** et
n'embarque **aucun code serveur** (il n'importe du moteur que des constantes).

## L'entrée Inertia

Le moteur rend des pages nommées `forge/ResourceIndex|Show|Form` ; vos pages
custom ont des noms libres (`Dashboard`…). Le resolver duale les deux :

```ts
import { FORGE_PAGE_NS } from "@/brand"

resolve: (name) => {
  const isForge = name.startsWith(`${FORGE_PAGE_NS}/`)
  const pages = isForge
    ? import.meta.glob("../forge/ui/pages/**/*.vue", { eager: true })
    : import.meta.glob("./pages/**/*.vue", { eager: true })
  const file = isForge ? name.slice(FORGE_PAGE_NS.length + 1) : name
  const key = Object.keys(pages).find((k) => k.endsWith(`/pages/${file}.vue`))
  if (!key) throw new Error(`Page introuvable : "${name}"`)
  return pages[key] as object
}
```

## Injecter votre layout

Les pages du kit rendent leur contenu **dans votre chrome** — fourni par
injection au montage de l'app :

```ts
import { FORGE_LAYOUT } from "@/layout"

app.provide(FORGE_LAYOUT, MonLayout)   // sans lui : passthrough minimal
```

Votre layout reçoit le contenu en slot par défaut et lit la nav partagée :

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
    <aside><!-- groupez `nav` par .group, rendez navIcon(e.icon) + e.label --></aside>
    <main class="min-w-0 flex-1 p-6"><slot /></main>
  </div>
</template>
```

## Les composables

| Composable | Rôle |
|---|---|
| `useForgeLayout()` | Le layout injecté (fallback passthrough). |
| `useForgePrefix()` | Le préfixe du CRUD, lu depuis les props — jamais de `/admin` en dur. |
| `useForgeT()` | `t()` scopé aux messages du kit (`t("actions.edit")`). |
| `useResourceTable(name, initial)` | État complet d'une liste : recherche débouncée, tri, filtres, pagination (tout server-side via reloads partiels Inertia) + masquage de colonnes persisté. |
| `useResourceForm(name, fields, row, mode, scope?)` | Formulaire Inertia d'une resource (valeurs initiales, submit, erreurs). |

## Composants custom (escape hatches)

**Affichage / saisie d'un champ** — enregistrez un composant, référencez-le par
nom dans la def du champ :

```ts
import { registerDisplay } from "@/fields"
import { registerInput } from "@/inputs"
import RatingDisplay from "./RatingDisplay.vue"
import RatingInput from "./RatingInput.vue"

registerDisplay("rating", RatingDisplay)  // reçoit { field, value }
registerInput("rating", RatingInput)      // v-model + { field }
```

```ts
text("score", { display: "rating", input: "rating", editable: true })
```

**Icônes de nav** — le serveur envoie un *nom*, le front le résout :

```ts
import { registerNavIcon } from "@/nav"
import { PhGauge } from "@phosphor-icons/vue"

registerNavIcon("gauge", PhGauge)
```

## Les primitives

Le kit expose ses primitives (`@/primitives/*`) : `button`, `input`, `select`,
`table`, `card`, `badge`, `dialog`, `dropdown-menu`, `checkbox`, `switch`,
`textarea`, `tooltip`, `separator`, `scroll-area`, `sonner` (toasts)… Vos pages
custom les composent pour rester visuellement cohérentes avec le CRUD — mêmes
design tokens, même dark mode.

`OverflowRow` mérite une mention : une rangée responsive « priority+ » qui
pousse les éléments qui débordent dans un menu « … » — le kit l'utilise pour
les boutons d'en-tête de fiche et les onglets.

## Utiliser le kit sans le moteur ?

Partiellement : primitives et composables fonctionnent dans toute app
Vue/Inertia, mais les pages CRUD consomment la forme de props que le moteur
produit. Le kit est pensé comme la moitié front du moteur — pas comme une UI
lib généraliste.
