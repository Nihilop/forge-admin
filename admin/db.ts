// Forge · façade — résolution de l'option `db` vers un ForgeAdapter.
// Trois formes acceptées, de la plus simple à la plus custom :
//   db: "postgres://…"        → driver intégré (@db/postgres, pool paresseux)
//   db: { query }             → ton exécuteur SQL (PGlite, postgres.js, Neon…)
//   db: monAdapter            → un ForgeAdapter complet (autre stockage)
// Le driver @db/postgres (spécifique Deno) est importé DYNAMIQUEMENT : il n'est
// chargé que si `db` est une URL → les autres formes restent runtime-agnostiques.

import type { Pool } from "@db/postgres"
import { type ForgeAdapter, postgresAdapter, type Row } from "../engine/mod.ts"

/** A SQL executor: runs a parameterized query and returns the rows. */
export type SqlExecutor = (sql: string, params?: unknown[]) => Promise<Row[]>

/** The `db` option: a Postgres URL (built-in driver), a `{ query }` executor
 *  (bring your own driver), or a full {@linkcode ForgeAdapter} (other store). */
export type DbOption = string | { query: SqlExecutor } | ForgeAdapter

/** Resolves the `db` option to a {@linkcode ForgeAdapter}. */
export function resolveDb(db: DbOption): ForgeAdapter {
  if (typeof db === "string") return postgresAdapter({ query: poolExecutor(db) })
  if ("count" in db && "list" in db) return db as ForgeAdapter
  return postgresAdapter({ query: (db as { query: SqlExecutor }).query })
}

/** Exécuteur sur pool @db/postgres. PARESSEUX deux fois : le module driver
 *  n'est importé qu'à la première requête, et le pool ne se connecte qu'à la
 *  demande (le process démarre même si la DB n'est pas encore là). */
function poolExecutor(url: string): SqlExecutor {
  let pool: Promise<Pool> | undefined
  const getPool = () => (pool ??= import("@db/postgres").then((m) => new m.Pool(url, 4, true)))
  return async (sql, params) => {
    const conn = await (await getPool()).connect()
    try {
      const res = await conn.queryObject<Row>(sql, params ?? [])
      return res.rows
    } finally {
      conn.release()
    }
  }
}
