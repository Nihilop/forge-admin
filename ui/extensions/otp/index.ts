// Forge · extension OTP — moitié FRONT. Fournie avec le kit, DÉSACTIVÉE par
// défaut : `installForgeExtensions(app, [otpUi()], { i18n })`. Monte le dialog
// d'élévation via l'outlet `overlays` du shell ; les pages (OtpSetup,
// OtpChallenge) sont dans ui/pages/ et rendues par la moitié serveur
// (`otpServer()`, côté @streemkit/forge/extensions/otp).

import type { ForgeUiExtension } from "../../extensions"
import ElevationDialog from "./ElevationDialog.vue"
import OtpProfileSection from "./OtpProfileSection.vue"

export { ensureElevated } from "./elevation"
export { default as ElevationDialog } from "./ElevationDialog.vue"
export { default as OtpProfileSection } from "./OtpProfileSection.vue"

/** La moitié UI de l'extension OTP/2FA : dialog d'élévation (outlet `overlays`)
 *  + section 2FA sur la page Profil (outlet `profile:sections`). Pendant
 *  serveur : `otpServer()`. */
export function otpUi(): ForgeUiExtension {
  return {
    name: "otp",
    outlets: {
      "overlays": ElevationDialog,
      "profile:sections": OtpProfileSection,
    },
  }
}
