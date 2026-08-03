// Site de doc — VitePress (écosystème Vue, cohérent avec le kit ui/).
// Deux locales : EN à la racine (via rewrites en/* → *), FR sous /fr/.
// Arborescences SYMÉTRIQUES (en/guide/x ↔ fr/guide/x) → le sélecteur de
// langue bascule page à page. Produit : « Forge » (@streemkit/forge).

import { defineConfig } from "vitepress"

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
      { text: "Custom pages", link: "/guide/pages" },
    ],
  },
  {
    text: "Integration",
    items: [
      { text: "The forge() facade", link: "/guide/facade" },
      { text: "Bare engine & adapters", link: "/guide/engine" },
      { text: "Frontend kit", link: "/guide/frontend" },
      { text: "Internationalization", link: "/guide/i18n" },
      { text: "Deploying", link: "/guide/deploy" },
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
      { text: "Pages custom", link: "/fr/guide/pages" },
    ],
  },
  {
    text: "Intégration",
    items: [
      { text: "La façade forge()", link: "/fr/guide/facade" },
      { text: "Moteur nu & adapters", link: "/fr/guide/engine" },
      { text: "Kit frontend", link: "/fr/guide/frontend" },
      { text: "Internationalisation", link: "/fr/guide/i18n" },
      { text: "Déployer", link: "/fr/guide/deploy" },
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
          { text: "Integration", link: "/guide/facade" },
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
          { text: "Intégration", link: "/fr/guide/facade" },
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
