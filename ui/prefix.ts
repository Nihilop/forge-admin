// Forge · kit Vue — préfixe d'URL du CRUD, côté front. Le moteur l'injecte dans
// les props de CHAQUE page qu'il rend (`prefix`) : le kit ne code jamais
// `/admin` en dur. Fallback sur le défaut pour les pages custom de l'hôte qui
// utilisent le kit sans passer par le routeur Forge.

import { usePage } from "@inertiajs/vue3"
import { DEFAULT_ADMIN_PREFIX } from "./brand"

/** Préfixe d'URL du CRUD (`/admin` par défaut). À appeler dans un setup(). */
export function useForgePrefix(): string {
  const props = usePage().props as { prefix?: unknown }
  return typeof props.prefix === "string" ? props.prefix : DEFAULT_ADMIN_PREFIX
}
