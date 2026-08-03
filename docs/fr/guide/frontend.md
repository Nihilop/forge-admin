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

## Le shell par défaut (clé en main)

Sans rien configurer, les pages s'affichent dans **`ForgeShell`** : sidebar
générée depuis la nav unifiée (groupes, icônes, états actifs), topbar, thème
clair/sombre persisté, sélecteur de langue, responsive (drawer mobile) — et des
**outlets** où les extensions se branchent.

Personnalisation par options :

```ts
import { FORGE_SHELL_OPTIONS } from "@/shell/options"

app.provide(FORGE_SHELL_OPTIONS, {
  title: "Mon back-office",
  subtitle: "prod",
  // logo: MonLogo,          // composant, remplace la pastille
  // homeHref: "/dashboard",
  // themeToggle: false,
  // localeSwitcher: false,
})
```

## Remplacer le shell (escape hatch)

Le shell n'est qu'un **défaut**. Pour votre propre chrome, injectez-le — les
pages du kit rendront leur contenu dedans :

```ts
import { FORGE_LAYOUT, ForgeBareLayout } from "@/layout"

app.provide(FORGE_LAYOUT, MonLayout)        // votre chrome complet
// ou : app.provide(FORGE_LAYOUT, ForgeBareLayout)  // aucun chrome (passthrough)
```

Votre layout reçoit le contenu en slot par défaut et lit la nav partagée
(`usePage().props.forge.nav` — groupez par `.group`, résolvez les icônes avec
`navIcon()`, gérez `exact` pour l'état actif).

## Les extensions UI

Le kit n'embarque **aucune feature optionnelle** (2FA, notifications, menu
user…) — il expose des points d'ancrage. Une extension les regroupe :

```ts
import { installForgeExtensions } from "@/extensions"

installForgeExtensions(app, [
  {
    name: "two-factor",
    outlets: { "sidebar:footer": TwoFactorBadge },  // monté dans le shell
    inputs: { otp: OtpInput },                       // input de champ custom
    icons: { shield: PhShieldCheck },
    messages: { fr: { twoFactor: { title: "Double authentification" } } },
    setup: ({ app }) => { /* plugins, provide, directives… */ },
  },
], { i18n })   // avant app.mount()
```

Outlets fournis par le shell : `header` (droite de la topbar) et
`sidebar:footer` (bas de la sidebar). Le pendant **serveur** d'une extension
(routes, resources, pages) passe par l'option `extensions` de la
[façade](facade).

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

## Thème & styles

Le kit ne livre **aucun CSS précompilé** : il fournit `ui/styles/forge.css`
(Tailwind v4 + directive `@source` vers les sources du kit + design system
« Clay » light/dark + polices) et c'est le **build de votre projet** qui
génère la feuille finale — purge commune, tokens partagés entre le CRUD et vos
pages custom, HMR natif.

```css
/* Le thème par défaut, en une ligne : */
@import "@streemkit/forge/ui/styles/forge.css";

/* Personnaliser : surcharger les tokens APRÈS l'import. */
:root { --primary: #4f46e5; --radius: 0.5rem; }
.dark { --primary: #6366f1; }
```

Thème entièrement custom : n'importez pas `forge.css` et fournissez vos
propres tokens (mêmes noms de variables) + `@import "tailwindcss"` +
`@source` vers le kit.

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
