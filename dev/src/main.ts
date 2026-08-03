import { createApp, h } from "vue"
import { createInertiaApp } from "@inertiajs/vue3"
import { PhGauge, PhPackage, PhReceipt, PhRocketLaunch } from "@phosphor-icons/vue"
import "./style.css"
import { FORGE_LAYOUT } from "@/layout"
import { createForgeI18n } from "@/i18n"
import { FORGE_PAGE_NS, FORGE_STORAGE_NS } from "@/brand"
import { registerNavIcon } from "@/nav"
import DevLayout from "./DevLayout.vue"

// Icônes custom de l'APP (escape hatch) : référencées par NOM côté serveur
// (nav du dashboard, action « Publier »), résolues ici en composants.
registerNavIcon("gauge", PhGauge)
registerNavIcon("rocket", PhRocketLaunch)
registerNavIcon("package", PhPackage)
registerNavIcon("receipt", PhReceipt)

// i18n de Forge (fr/en). Langue initiale = préférence persistée, sinon fr.
const i18n = createForgeI18n({ locale: localStorage.getItem(`${FORGE_STORAGE_NS}:locale`) ?? "fr" })

// Résolution DUALE : les pages du MOTEUR (`<ns>/ResourceIndex|Show|Form`) sont
// résolues depuis le KIT (../ui/pages) ; les autres (ex. "Dashboard") sont les
// pages de l'APP (./pages). On injecte le layout de l'app via FORGE_LAYOUT.
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
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .use(i18n)
      .provide(FORGE_LAYOUT, DevLayout)
      .mount(el)
  },
})
