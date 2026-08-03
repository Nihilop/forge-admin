// Forge · moteur — pages CUSTOM dans le menu. Une page custom n'est PAS un CRUD
// généré : c'est TA route + TON composant (KYC, monitoring, matrice de rôles…),
// simplement ENREGISTRÉE dans le même menu que les resources. Le moteur ne rend
// rien ici — il n'expose que l'entrée de nav. AGNOSTIQUE.

import type { ForgeNav } from "./resource.ts"

/** A CUSTOM page's menu entry — the route and component are owned by the host
 *  app; {@linkcode definePage} only registers the sidebar entry. */
export interface PageDef {
  /** Id unique. */
  name: string
  /** Route (gérée par TON app, hors Forge). */
  href: string
  /** Libellé affiché. */
  label: string
  /** Place dans la sidebar (obligatoire : une page custom existe pour le menu). */
  nav: ForgeNav
  /** Permission requise pour voir l'entrée. */
  permission?: string
  /** Lien actif en match EXACT de l'URL (sinon préfixe). */
  exact?: boolean
}

const pages = new Map<string, PageDef>()

/** Declares a CUSTOM page's menu entry. The route and the component stay yours —
 *  Forge only adds the entry to the unified sidebar. */
export function definePage(def: PageDef): PageDef {
  pages.set(def.name, def)
  return def
}

/** Every registered custom page, in registration order. */
export function allPages(): PageDef[] {
  return [...pages.values()]
}
