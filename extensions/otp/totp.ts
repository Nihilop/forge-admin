// Forge · extension OTP — TOTP RFC 6238 (HOTP RFC 4226), 100 % WebCrypto :
// zéro dépendance, Deno Deploy-ready. Compatible Google Authenticator, Aegis,
// 1Password… (SHA-1, 6 chiffres, pas de 30 s — les défauts de l'écosystème).

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

/** Encode des octets en base32 (RFC 4648, sans padding — format otpauth). */
export function base32Encode(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let out = ""
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31]
  return out
}

/** Décode une chaîne base32 (tolère espaces, tirets et minuscules). */
export function base32Decode(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/[\s-]/g, "").replace(/=+$/, "")
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch)
    if (idx === -1) throw new Error(`base32: caractère invalide « ${ch} »`)
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return new Uint8Array(out)
}

/** Génère un secret TOTP (20 octets d'entropie, base32). */
export function generateTotpSecret(): string {
  return base32Encode(crypto.getRandomValues(new Uint8Array(20)))
}

/** Code HOTP (RFC 4226) pour un compteur donné. */
export async function hotp(secretB32: string, counter: number, digits = 6): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    base32Decode(secretB32) as BufferSource,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  )
  const msg = new Uint8Array(8)
  new DataView(msg.buffer).setBigUint64(0, BigInt(counter))
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg as BufferSource))
  const offset = mac[mac.length - 1] & 0x0f
  const code = ((mac[offset] & 0x7f) << 24) |
    (mac[offset + 1] << 16) |
    (mac[offset + 2] << 8) |
    mac[offset + 3]
  return String(code % 10 ** digits).padStart(digits, "0")
}

/** Code TOTP (RFC 6238) pour un instant donné (défaut : maintenant). */
export function totp(
  secretB32: string,
  at: number = Date.now(),
  stepSeconds = 30,
): Promise<string> {
  return hotp(secretB32, Math.floor(at / 1000 / stepSeconds))
}

/** Vérifie un code TOTP avec fenêtre ±1 pas (tolérance d'horloge) et
 *  ANTI-REPLAY : renvoie le compteur accepté (à persister — tout code d'un
 *  compteur ≤ `lastCounter` est refusé), ou `null` si invalide. */
export async function verifyTotp(
  secretB32: string,
  code: string,
  lastCounter: number | null,
  at: number = Date.now(),
  stepSeconds = 30,
): Promise<number | null> {
  const clean = code.replace(/\s/g, "")
  if (!/^\d{6}$/.test(clean)) return null
  const counter = Math.floor(at / 1000 / stepSeconds)
  for (const offset of [0, -1, 1]) {
    const candidate = counter + offset
    if (lastCounter != null && candidate <= lastCounter) continue // anti-replay
    if ((await hotp(secretB32, candidate)) === clean) return candidate
  }
  return null
}

/** URI `otpauth://` d'enrollment (à afficher/copier — QR compatible). */
export function otpauthUri(secretB32: string, account: string, issuer: string): string {
  const iss = encodeURIComponent(issuer)
  return `otpauth://totp/${iss}:${
    encodeURIComponent(account)
  }?secret=${secretB32}&issuer=${iss}&algorithm=SHA1&digits=6&period=30`
}
