/**
 * Forge — extension OTP/2FA (moitié serveur). Fournie avec la lib, DÉSACTIVÉE
 * par défaut : activez-la explicitement.
 *
 * @example
 * ```ts
 * import { otpApiOf, otpServer } from "@streemkit/forge/extensions/otp"
 *
 * const admin = forge({ db, auth: { seed }, extensions: [otpServer({ issuer: "MonApp" })] })
 * const otp = otpApiOf(admin)
 *
 * // Action sensible : exige une session élevée (confirmation OTP).
 * admin.app.post("/danger", otp.requireElevation(), (c) => c.json({ done: true }))
 * ```
 *
 * Le pendant FRONT (`otpUi()`, `useElevation()`) s'importe depuis le kit :
 * `@forge/extensions/otp`.
 *
 * @module
 */

export { type OtpApi, otpApiOf, type OtpOptions, otpServer } from "./server.ts"
export {
  base32Decode,
  base32Encode,
  generateTotpSecret,
  hotp,
  otpauthUri,
  totp,
  verifyTotp,
} from "./totp.ts"
