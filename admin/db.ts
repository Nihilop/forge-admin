// Forge · façade — résolution de l'option `db` vers un ForgeAdapter.
// Trois formes acceptées, de la plus simple à la plus custom :
//   db: "postgres://…"        → driver intégré (@db/postgres, pool paresseux)
//   db: { query }             → ton exécuteur SQL (PGlite, postgres.js, Neon…)
//   db: monAdapter            → un ForgeAdapter complet (autre stockage)

import { Pool } from "@db/postgres"
import { type ForgeAdapter, postgresAdapter, type Row } from "forge/engine"

export type SqlExecutor = (sql: string, params?: unknown[]) => Promise<Row[]>

export type DbOption = string | { query: SqlExecutor } | ForgeAdapter

export function resolveDb(db: DbOption): ForgeAdapter {
  if (typeof db === "string") return postgresAdapter({ query: poolExecutor(db) })
  if ("count" in db && "list" in db) return db as ForgeAdapter
  return postgresAdapter({ query: (db as { query: SqlExecutor }).query })
}

/** Exécuteur sur pool @db/postgres. PARESSEUX : aucune connexion avant la
 *  première requête (le process démarre même si la DB n'est pas encore là). */
function poolExecutor(url: string): SqlExecutor {
  const pool = new Pool(url, 4, true)
  return async (sql, params) => {
    const conn = await pool.connect()
    try {
      const res = await conn.queryObject<Row>(sql, params ?? [])
      return res.rows
    } finally {
      conn.release()
    }
  }
}
