// Forge · extension OTP (front) — ÉLÉVATION. `ensureElevated()` garantit une
// session élevée : déjà élevée → résout tout de suite ; sinon ouvre le dialog
// OTP partagé (ElevationDialog, monté via l'outlet `overlays` par `otpUi()`),
// vérifie le code auprès du serveur et résout. Pattern d'usage :
//
//   if (await ensureElevated(prefix)) router.post("/action-sensible")
//
// État module-scope : un seul dialog, partagé (même modèle que confirm.ts).

import { type Ref, ref } from "vue"

const open = ref(false)
const pending = ref(false)
const error = ref(false)
let currentPrefix = "/admin"
let resolver: ((ok: boolean) => void) | null = null

/** Garantit une session ÉLEVÉE (confirmation OTP si nécessaire). Résout `true`
 *  si l'élévation est acquise, `false` si l'utilisateur annule. */
export async function ensureElevated(prefix: string): Promise<boolean> {
  currentPrefix = prefix
  // Tente l'élévation directe : si l'admin n'a pas de 2FA (mode non strict),
  // le serveur l'accorde sans code — pas de dialog inutile.
  if (await postElevate("")) return true
  error.value = false
  open.value = true
  return new Promise((res) => (resolver = res))
}

async function postElevate(code: string): Promise<boolean> {
  try {
    const res = await fetch(`${currentPrefix}/system/otp/elevate`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
    return res.ok
  } catch {
    return false
  }
}

/** État interne consommé par ElevationDialog.vue (ne pas utiliser ailleurs). */
export function useElevationDialog(): {
  open: Ref<boolean>
  pending: Ref<boolean>
  error: Ref<boolean>
  submit: (code: string) => Promise<void>
  cancel: () => void
} {
  return {
    open,
    pending,
    error,
    submit: async (code: string) => {
      pending.value = true
      error.value = false
      const ok = await postElevate(code)
      pending.value = false
      if (!ok) {
        error.value = true
        return
      }
      open.value = false
      resolver?.(true)
      resolver = null
    },
    cancel: () => {
      open.value = false
      resolver?.(false)
      resolver = null
    },
  }
}
