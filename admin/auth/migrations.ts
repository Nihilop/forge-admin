// Forge · auth — MIGRATIONS des tables SYSTÈME (préfixe `forge_`), par
// dialecte. Structure multi-DB : chaque étape porte ses variantes ; seuls les
// dialectes listés ici sont pris en charge (postgres aujourd'hui — mysql,
// mariadb, mongodb rejoindront ce fichier avec leurs adapters). Le suivi se
// fait dans `forge_migrations` : idempotent, ordonné, append-only.
// JAMAIS appliqué aux tables métier de l'hôte.

/** Exécuteur natif du stockage (le `raw` de l'adapter). */
export type Raw = (query: string, params?: unknown[]) => Promise<Record<string, unknown>[]>

/** Dialectes de stockage pris en charge par les migrations système. */
export type Dialect = "postgres"

// Schéma auth v1. La table admin embarque le nécessaire 2FA GÉNÉRIQUE
// (totp_secret/totp_enabled) : l'extension OTP s'appuie sur le modèle Admin
// sans migration supplémentaire. `elevated_until` sur la session prépare la
// fonction d'élévation (confirmation OTP d'actions sensibles).
const STEPS: MigrationStepDef[] = [
  {
    id: "0001_auth_core",
    dialects: {
      postgres: [
        `CREATE TABLE IF NOT EXISTS forge_roles (
          id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          name        TEXT NOT NULL UNIQUE,
          permissions TEXT NOT NULL DEFAULT '[]',
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )`,
        `CREATE TABLE IF NOT EXISTS forge_admins (
          id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          email         TEXT NOT NULL UNIQUE,
          name          TEXT,
          password_hash TEXT NOT NULL,
          role_id       BIGINT REFERENCES forge_roles (id),
          totp_secret   TEXT,
          totp_enabled  BOOLEAN NOT NULL DEFAULT false,
          disabled_at   TIMESTAMPTZ,
          created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        )`,
        `CREATE TABLE IF NOT EXISTS forge_sessions (
          token_hash     TEXT PRIMARY KEY,
          admin_id       BIGINT NOT NULL REFERENCES forge_admins (id) ON DELETE CASCADE,
          expires_at     TIMESTAMPTZ NOT NULL,
          elevated_until TIMESTAMPTZ,
          created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
        )`,
        `CREATE INDEX IF NOT EXISTS forge_sessions_admin_idx ON forge_sessions (admin_id)`,
      ],
    },
  },
]

/** Une étape de migration système (requêtes par dialecte) — le format que les
 *  EXTENSIONS utilisent aussi pour leurs propres tables (ids préfixés). */
export interface MigrationStepDef {
  /** Id unique, ordonné (ex. `otp_0001_challenges`). */
  id: string
  /** Les requêtes par dialecte. Un dialecte absent = étape non supportée. */
  dialects: Partial<Record<Dialect, string[]>>
}

/** Applique des étapes de migration manquantes (suivi partagé en
 *  `forge_migrations`). Idempotent — sûr à exécuter à chaque boot. Utilisé par
 *  le module auth ET par les extensions (avec leurs propres étapes). */
export async function runMigrationSteps(
  raw: Raw,
  steps: MigrationStepDef[],
  dialect: Dialect = "postgres",
): Promise<string[]> {
  await raw(
    `CREATE TABLE IF NOT EXISTS forge_migrations (
      id         TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
  )
  const done = new Set(
    (await raw(`SELECT id FROM forge_migrations`)).map((r) => String(r.id)),
  )
  const applied: string[] = []
  for (const step of steps) {
    if (done.has(step.id)) continue
    const queries = step.dialects[dialect]
    if (!queries) {
      throw new Error(`Forge: dialecte "${dialect}" non supporté (étape ${step.id}).`)
    }
    for (const q of queries) await raw(q)
    await raw(`INSERT INTO forge_migrations (id) VALUES ($1)`, [step.id])
    applied.push(step.id)
  }
  return applied
}

/** Applique les migrations du module AUTH. Idempotent. */
export function runAuthMigrations(raw: Raw, dialect: Dialect = "postgres"): Promise<string[]> {
  return runMigrationSteps(raw, STEPS, dialect)
}
