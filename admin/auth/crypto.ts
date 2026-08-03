// Forge · auth — primitives crypto, 100 % WebCrypto (zéro dépendance, Deno
// Deploy-ready). Hash de mot de passe PBKDF2-SHA256, jetons de session opaques.

const enc = new TextEncoder()

const PBKDF2_ITERATIONS = 210_000
const SALT_BYTES = 16
const KEY_BYTES = 32

function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let s = ""
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

function fromB64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

async function pbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ])
  return await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    KEY_BYTES * 8,
  )
}

/** Hash un mot de passe → chaîne autoportante `pbkdf2$<iter>$<salt>$<hash>`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const derived = await pbkdf2(password, salt, PBKDF2_ITERATIONS)
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toB64(salt)}$${toB64(derived)}`
}

/** Vérifie un mot de passe contre un hash `hashPassword` (temps constant). */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$")
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false
  const iterations = Number(parts[1])
  if (!Number.isFinite(iterations) || iterations < 1) return false
  const salt = fromB64(parts[2])
  const expected = fromB64(parts[3])
  const derived = new Uint8Array(await pbkdf2(password, salt, iterations))
  if (derived.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < derived.length; i++) diff |= derived[i] ^ expected[i]
  return diff === 0
}

/** Jeton opaque aléatoire (base64url, 32 octets d'entropie). */
export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return toB64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")
}

/** SHA-256 hexadécimal — la DB ne stocke que le hash du jeton de session. */
export async function sha256hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(value))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("")
}
