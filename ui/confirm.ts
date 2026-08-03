// Forge · kit Vue — confirmation PROMISE-BASED (remplace window.confirm).
// Usage : `if (await confirmAction("Supprimer ?")) …` — la boîte (AlertDialog)
// est rendue par components/ConfirmDialog.vue, monté par les pages du kit.
// État module-scope : une seule boîte, partagée.

import { type Ref, ref } from "vue"

const open = ref(false)
const message = ref("")
let resolver: ((v: boolean) => void) | null = null

/** Ouvre la confirmation du kit ; résout `true` si l'utilisateur confirme. */
export function confirmAction(msg: string): Promise<boolean> {
  message.value = msg
  open.value = true
  return new Promise((res) => (resolver = res))
}

/** État interne consommé par ConfirmDialog.vue (ne pas utiliser ailleurs). */
export function useConfirmDialog(): {
  open: Ref<boolean>
  message: Ref<string>
  answer: (v: boolean) => void
} {
  return {
    open,
    message,
    answer: (v: boolean) => {
      open.value = false
      resolver?.(v)
      resolver = null
    },
  }
}
