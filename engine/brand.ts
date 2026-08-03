// Forge · nommage — SOURCE UNIQUE du nom technique. Nom OFFICIEL du produit :
// « Forge », publié sous `@streemkit/forge`. Toutes les chaînes techniques
// (namespace des pages Inertia, namespace i18n, clés localStorage, préfixe des
// tables système) dérivent de FORGE_BRAND — un éventuel rebranding futur =
// changer cette constante + les symboles d'API (IDE) + l'alias (deno.json).
// AUCUNE dépendance ici : ce module est aussi importé par le kit ui/ (bundlé
// Vite) via ui/brand.ts.

/** Nom technique du framework. */
export const FORGE_BRAND = "forge"

/** Namespace des pages Inertia rendues par le moteur (`forge/ResourceIndex`…). */
export const FORGE_PAGE_NS = FORGE_BRAND

/** Nom complet d'une page du moteur (côté serveur ET résolution côté front). */
export function forgePage(name: string): string {
  return `${FORGE_PAGE_NS}/${name}`
}

/** Namespace des messages i18n du kit (`forge.actions.edit`…). */
export const FORGE_I18N_NS = FORGE_BRAND

/** Namespace des clés localStorage du kit (`forge:<resource>:hidden-cols`…). */
export const FORGE_STORAGE_NS = FORGE_BRAND

/** Préfixe des futures tables SYSTÈME (auth/RBAC builtin — Phase 2). Jamais
 *  appliqué aux tables métier de l'hôte. */
export const FORGE_TABLE_PREFIX = `${FORGE_BRAND}_`

/** Préfixe d'URL par défaut du montage CRUD (configurable via ForgeContext). */
export const DEFAULT_ADMIN_PREFIX = "/admin"
