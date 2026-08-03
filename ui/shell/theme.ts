// Forge · kit Vue — thème clair/sombre du shell. Applique la classe `dark` sur
// <html> (les tokens du design system la déclinent), persiste le choix dans
// localStorage, et suit la préférence système tant que l'utilisateur n'a pas
// choisi. État module-scope : partagé par tous les composants.

import { type Ref, ref } from "vue"
import { FORGE_STORAGE_NS } from "../brand"

const STORAGE_KEY = `${FORGE_STORAGE_NS}:theme`

const dark = ref(false)
let initialized = false

function apply(): void {
  if (typeof document === "undefined") return
  document.documentElement.classList.toggle("dark", dark.value)
}

function init(): void {
  if (initialized || typeof document === "undefined") return
  initialized = true
  let stored: string | null = null
  try {
    stored = localStorage.getItem(STORAGE_KEY)
  } catch { /* stockage indisponible */ }
  dark.value = stored != null
    ? stored === "dark"
    : globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
  apply()
}

/** Le thème du shell : `dark` (réactif) + `toggle()` (persiste le choix). */
export function useForgeTheme(): { dark: Ref<boolean>; toggle: () => void } {
  init()
  return {
    dark,
    toggle: () => {
      dark.value = !dark.value
      apply()
      try {
        localStorage.setItem(STORAGE_KEY, dark.value ? "dark" : "light")
      } catch { /* idem */ }
    },
  }
}
