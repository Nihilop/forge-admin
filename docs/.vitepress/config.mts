// Site de doc — VitePress (écosystème Vue, cohérent avec le kit ui/).
// Deux locales : EN à la racine (via rewrites en/* → *), FR sous /fr/.
// Arborescences SYMÉTRIQUES (en/guide/x ↔ fr/guide/x) → le sélecteur de
// langue bascule page à page. Produit : « Forge » (@streemkit/forge).

import { defineConfig } from "vitepress"

/** Pages composants, groupées par famille (mêmes slugs dans les 2 locales). */
const componentGroups = (p: string, labels: {
  actions: string
  forms: string
  display: string
  overlays: string
  nav: string
  kit: string
}) => [
  {
    text: labels.actions,
    collapsed: true,
    items: [
      { text: "Button", link: `${p}/button` },
      { text: "DropdownMenu", link: `${p}/dropdown-menu` },
    ],
  },
  {
    text: labels.forms,
    collapsed: true,
    items: [
      { text: "Input", link: `${p}/input` },
      { text: "Textarea", link: `${p}/textarea` },
      { text: "Select", link: `${p}/select` },
      { text: "Checkbox", link: `${p}/checkbox` },
      { text: "Switch", link: `${p}/switch` },
      { text: "Label", link: `${p}/label` },
      { text: "Calendar", link: `${p}/calendar` },
    ],
  },
  {
    text: labels.display,
    collapsed: true,
    items: [
      { text: "Badge", link: `${p}/badge` },
      { text: "Card", link: `${p}/card` },
      { text: "Table", link: `${p}/table` },
      { text: "Skeleton", link: `${p}/skeleton` },
      { text: "Separator", link: `${p}/separator` },
      { text: "Tooltip", link: `${p}/tooltip` },
    ],
  },
  {
    text: labels.overlays,
    collapsed: true,
    items: [
      { text: "Dialog", link: `${p}/dialog` },
      { text: "AlertDialog", link: `${p}/alert-dialog` },
      { text: "Popover", link: `${p}/popover` },
      { text: "Sheet", link: `${p}/sheet` },
      { text: "Sonner (toasts)", link: `${p}/sonner` },
    ],
  },
  {
    text: labels.nav,
    collapsed: true,
    items: [
      { text: "Sidebar", link: `${p}/sidebar` },
      { text: "Breadcrumb", link: `${p}/breadcrumb` },
    ],
  },
  {
    text: labels.kit,
    collapsed: true,
    items: [
      { text: "ConfirmDialog", link: `${p}/confirm-dialog` },
      { text: "OverflowRow", link: `${p}/overflow-row` },
    ],
  },
]

const guideEn = [
  {
    text: "Start here",
    items: [
      { text: "Getting started", link: "/guide/getting-started" },
      { text: "Example app", link: "/guide/playground" },
    ],
  },
  {
    text: "Core",
    items: [
      { text: "Resources", link: "/guide/resources" },
      { text: "Fields", link: "/guide/fields" },
      { text: "Permissions (RBAC)", link: "/guide/permissions" },
      { text: "Authentication", link: "/guide/auth" },
      { text: "2FA (OTP extension)", link: "/guide/otp" },
      { text: "Custom pages", link: "/guide/pages" },
    ],
  },
  {
    text: "Integration",
    items: [
      { text: "The forge() facade", link: "/guide/facade" },
      { text: "Bare engine & adapters", link: "/guide/engine" },
      { text: "Frontend kit", link: "/guide/frontend" },
      { text: "Outlets", link: "/guide/outlets" },
      { text: "Internationalization", link: "/guide/i18n" },
      { text: "Deploying", link: "/guide/deploy" },
    ],
  },
  {
    text: "Components",
    items: [
      { text: "Overview", link: "/components/" },
      ...componentGroups("/components", {
        actions: "Actions",
        forms: "Forms",
        display: "Display",
        overlays: "Overlays",
        nav: "Navigation",
        kit: "Kit",
      }),
    ],
  },
]

const guideFr = [
  {
    text: "Démarrer",
    items: [
      { text: "Prise en main", link: "/fr/guide/getting-started" },
      { text: "App exemple", link: "/fr/guide/playground" },
    ],
  },
  {
    text: "Le cœur",
    items: [
      { text: "Resources", link: "/fr/guide/resources" },
      { text: "Champs", link: "/fr/guide/fields" },
      { text: "Permissions (RBAC)", link: "/fr/guide/permissions" },
      { text: "Authentification", link: "/fr/guide/auth" },
      { text: "2FA (extension OTP)", link: "/fr/guide/otp" },
      { text: "Pages custom", link: "/fr/guide/pages" },
    ],
  },
  {
    text: "Intégration",
    items: [
      { text: "La façade forge()", link: "/fr/guide/facade" },
      { text: "Moteur nu & adapters", link: "/fr/guide/engine" },
      { text: "Kit frontend", link: "/fr/guide/frontend" },
      { text: "Outlets", link: "/fr/guide/outlets" },
      { text: "Internationalisation", link: "/fr/guide/i18n" },
      { text: "Déployer", link: "/fr/guide/deploy" },
    ],
  },
  {
    text: "Composants",
    items: [
      { text: "Vue d'ensemble", link: "/fr/components/" },
      ...componentGroups("/fr/components", {
        actions: "Actions",
        forms: "Formulaires",
        display: "Affichage",
        overlays: "Surcouches",
        nav: "Navigation",
        kit: "Kit",
      }),
    ],
  },
]

export default defineConfig({
  title: "Forge",
  description:
    "The plug-and-play admin framework for Deno — declarative resources, full SSR CRUD, injected RBAC.",
  rewrites: { "en/:rest*": ":rest*" },
  head: [
    ["link", {
      rel: "icon",
      href:
        "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚒️</text></svg>",
    }],
  ],
  themeConfig: {
    search: { provider: "local" },
  },
  locales: {
    root: {
      label: "English",
      lang: "en",
      themeConfig: {
        nav: [
          { text: "Guide", link: "/guide/getting-started" },
          { text: "Components", link: "/components/" },
        ],
        sidebar: guideEn,
        outline: { label: "On this page" },
        docFooter: { prev: "Previous", next: "Next" },
        footer: { message: "@streemkit/forge — Deno · Hono · Vue/Inertia" },
      },
    },
    fr: {
      label: "Français",
      lang: "fr-FR",
      themeConfig: {
        nav: [
          { text: "Guide", link: "/fr/guide/getting-started" },
          { text: "Composants", link: "/fr/components/" },
        ],
        sidebar: guideFr,
        outline: { label: "Sur cette page" },
        docFooter: { prev: "Précédent", next: "Suivant" },
        darkModeSwitchLabel: "Thème",
        sidebarMenuLabel: "Menu",
        returnToTopLabel: "Haut de page",
        footer: { message: "@streemkit/forge — Deno · Hono · Vue/Inertia" },
      },
    },
  },
})
