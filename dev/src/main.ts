import { createApp, h } from "vue"
import { createInertiaApp } from "@inertiajs/vue3"
import "./style.css"
import { createForgeI18n } from "@/i18n"
import { FORGE_PAGE_NS, FORGE_STORAGE_NS } from "@/brand"
import { FORGE_SHELL_OPTIONS } from "@/shell/options"
import { installForgeExtensions } from "@/extensions"
import DevToolsButton from "./DevToolsButton.vue"

// i18n de Forge (fr/en). Langue initiale = préférence persistée, sinon fr.
const i18n = createForgeI18n({ locale: localStorage.getItem(`${FORGE_STORAGE_NS}:locale`) ?? "fr" })

// Résolution DUALE : les pages du MOTEUR (`<ns>/ResourceIndex|Show|Form`) sont
// résolues depuis le KIT (../ui/pages) ; les autres (ex. "Dashboard") sont les
// pages de l'APP (./pages). Aucun layout injecté → le ForgeShell par défaut du
// kit s'applique (clé en main) ; un hôte peut toujours provide(FORGE_LAYOUT, …).
createInertiaApp({
  resolve: (name) => {
    const isForge = name.startsWith(`${FORGE_PAGE_NS}/`)
    const pages = isForge
      ? import.meta.glob("../../ui/pages/**/*.vue", { eager: true })
      : import.meta.glob("./pages/**/*.vue", { eager: true })
    const file = isForge ? name.slice(FORGE_PAGE_NS.length + 1) : name
    // Match par suffixe : le format des clés de glob Vite peut varier.
    const key = Object.keys(pages).find((k) => k.endsWith(`/pages/${file}.vue`))
    if (!key) throw new Error(`[inertia] page introuvable : "${name}"`)
    return pages[key] as object
  },
  setup({ el, App, props, plugin }) {
    const app = createApp({ render: () => h(App, props) })
      .use(plugin)
      .use(i18n)

    // Personnalisation du shell par défaut (titre, sous-titre…).
    app.provide(FORGE_SHELL_OPTIONS, { title: "Forge", subtitle: "dev" })

    // EXTENSION démo : un bouton dans l'outlet `header` du shell. Une feature
    // optionnelle (2FA…) se brancherait exactement ainsi (outlets, inputs,
    // icônes, messages i18n…).
    installForgeExtensions(app, [
      { name: "dev-tools", outlets: { "header:end": DevToolsButton } },
    ], { i18n })

    app.mount(el)
  },
})
