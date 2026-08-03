// Forge · moteur — préfixe d'URL du montage CRUD (runtime, côté serveur).
// `createForgeRouter` le fixe depuis `ForgeContext.prefix` ; `forgeNav()` et le
// routeur génèrent toutes leurs URLs avec. Le front, lui, reçoit le préfixe via
// les props de page (jamais cet état-ci : il vit dans le process serveur).

import { DEFAULT_ADMIN_PREFIX } from "./brand.ts"

let current = DEFAULT_ADMIN_PREFIX

/** Normalise (`admin` → `/admin`, `/admin/` → `/admin`) et fixe le préfixe.
 *  `undefined` → inchangé. Renvoie la valeur effective. */
export function setForgePrefix(prefix?: string): string {
  if (prefix !== undefined) {
    let p = prefix.trim()
    if (p && !p.startsWith("/")) p = `/${p}`
    while (p.endsWith("/")) p = p.slice(0, -1)
    current = p // "" autorisé : montage à la racine
  }
  return current
}

/** Préfixe d'URL courant du CRUD (défaut : `/admin`). */
export function forgePrefix(): string {
  return current
}
