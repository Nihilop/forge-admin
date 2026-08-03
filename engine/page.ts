// Forge · moteur — pages CUSTOM dans le menu. Une page custom n'est PAS un CRUD
// généré : c'est TA route + TON composant (KYC, monitoring, matrice de rôles…),
// simplement ENREGISTRÉE dans le même menu que les resources. Le moteur ne rend
// rien ici — il n'expose que l'entrée de nav. AGNOSTIQUE.

import type { ForgeNav } from "./resource.ts"

export interface PageDef {
  /** Id unique. */
  name: string
  /** Route (gérée par TON app, hors Forge). */
  href: string
  label: string
  /** Place dans la sidebar (obligatoire : une page custom existe pour le menu). */
  nav: ForgeNav
  /** Permission requise pour voir l'entrée. */
  permission?: string
  /** Lien actif en match EXACT de l'URL (sinon préfixe). */
  exact?: boolean
}

const pages = new Map<string, PageDef>()

export function definePage(def: PageDef): PageDef {
  pages.set(def.name, def)
  return def
}

export function allPages(): PageDef[] {
  return [...pages.values()]
}
