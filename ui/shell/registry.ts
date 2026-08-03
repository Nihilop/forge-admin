// Forge · kit Vue — registre des OUTLETS du shell. Un outlet est un point
// d'ancrage nommé du layout par défaut (ForgeShell) dans lequel les extensions
// montent leurs composants (menu user, badge 2FA, notifications…). Le shell
// n'embarque AUCUNE feature optionnelle : il expose des emplacements.
//
// Outlets fournis par ForgeShell :
//   "header:start"    → topbar, à droite du trigger sidebar
//   "header:end"      → topbar, à droite (avant langue/thème)
//   "sidebar:footer"  → pied de la sidebar
//   "overlays"        → surcouches globales (dialogs d'extensions : élévation…)
// Outlets fournis par les PAGES du kit :
//   "profile:sections" → sections de la page Profil (carte 2FA de l'ext. OTP…)
//
// L'enregistrement se fait AU BOOT (avant mount), via installForgeExtensions()
// ou directement registerShellItem().

import type { Component } from "vue"

const outlets = new Map<string, Component[]>()

/** Monte un composant dans un outlet du shell (append, ordre d'enregistrement). */
export function registerShellItem(outlet: string, component: Component): void {
  const list = outlets.get(outlet) ?? []
  list.push(component)
  outlets.set(outlet, list)
}

/** Les composants enregistrés pour un outlet (vide si aucun). */
export function shellItems(outlet: string): Component[] {
  return outlets.get(outlet) ?? []
}
