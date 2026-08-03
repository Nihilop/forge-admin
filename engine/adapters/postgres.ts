// Forge · adapter POSTGRES — l'implémentation de référence du contrat
// ForgeAdapter. TOUT le SQL du framework vit ici (le routeur n'exprime que des
// intentions). Le DRIVER reste injecté via `query` : PGlite, postgres.js,
// @db/postgres, Neon serverless… tout exécuteur `(sql, params) → rows` convient.

import { getResource, type ResourceDef } from "../resource.ts"
import type { Field } from "../field.ts"
import type { ForgeAdapter, ListSelect, ListWhere, RelationTarget, Row } from "../adapter.ts"

/** Options of {@linkcode postgresAdapter}. */
export interface PostgresAdapterOptions {
  /** Exécute le SQL généré (SEUL point driver). */
  query: (sql: string, params?: unknown[]) => Promise<Row[]>
}

/** The reference {@linkcode ForgeAdapter}: translates the engine's intents into
 *  parameterized Postgres SQL. The DRIVER stays yours — any
 *  `(sql, params) => rows` executor works (PGlite, postgres.js, Neon…). */
export function postgresAdapter({ query }: PostgresAdapterOptions): ForgeAdapter {
  // Expression SELECT d'un champ. belongsTo → {id, label} via sous-requête. La
  // colonne FK est qualifiée par la table EXTERNE (`outerTable`) : sans ça, un
  // belongsTo AUTO-RÉFÉRENTIEL (relTable === outerTable, ex. blueprint.extends)
  // rend la corrélation ambiguë (la table interne a la même colonne) → label null.
  function colExpr(f: Field, outerTable: string): string {
    if (f.type === "belongsTo" && f.relation) {
      const relTable = getResource(f.relation.resource)?.table ?? f.relation.resource
      const fk = `"${outerTable}"."${f.relation.column}"`
      return `json_build_object('id', ${fk}, 'label', ` +
        `(SELECT "${f.relation.labelField}" FROM "${relTable}" AS _rel WHERE _rel."id" = ${fk})) AS "${f.key}"`
    }
    return `${f.column ?? `"${f.key}"`} AS "${f.key}"`
  }

  /** WHERE partagé count/list : soft-delete + recherche ILIKE + filtres facettés
   *  (tout est paramétré ; les expressions viennent des defs, code-defined). */
  function buildWhere(def: ResourceDef, w: ListWhere): { where: string; params: unknown[] } {
    const params: unknown[] = []
    const clauses: string[] = []
    if (def.softDelete) clauses.push(`"${def.softDelete}" IS NULL`)
    const q = (w.q ?? "").trim()
    if (q && def.search?.length) {
      const ors = def.search.map((k) => {
        params.push(`%${q}%`)
        return `"${k}" ILIKE $${params.length}`
      })
      clauses.push(`(${ors.join(" OR ")})`)
    }
    for (const { field, value } of w.filters ?? []) {
      params.push(value)
      clauses.push(`(${field.column ?? `"${field.key}"`}) = $${params.length}`)
    }
    return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params }
  }

  return {
    async count(def, w) {
      const { where, params } = buildWhere(def, w)
      const rows = await query(`SELECT COUNT(*)::int AS n FROM "${def.table}" ${where}`, params)
      return Number(rows[0]?.n ?? 0)
    },

    list(def, s: ListSelect) {
      const { where, params } = buildWhere(def, s)
      const cols = s.fields.map((f) => colExpr(f, def.table)).join(", ")
      // Tri : expression code-defined ; belongsTo trie par le LIBELLÉ de la cible.
      let order = def.orderBy ?? `"id" DESC`
      if (s.sort) {
        const f = s.sort.field
        const expr = f.type === "belongsTo" && f.relation
          ? `(SELECT "${f.relation.labelField}" FROM "${
            getResource(f.relation.resource)?.table ?? f.relation.resource
          }" AS _s WHERE _s."id" = "${def.table}"."${f.relation.column}")`
          : (f.column ?? `"${f.key}"`)
        order = `${expr} ${s.sort.dir === "asc" ? "ASC" : "DESC"} NULLS LAST, "id" DESC`
      }
      return query(
        `SELECT "id", ${cols} FROM "${def.table}" ${where} ORDER BY ${order} LIMIT ${s.limit} OFFSET ${s.offset}`,
        params,
      )
    },

    async get(def, id) {
      const cols = def.fields.map((f) => colExpr(f, def.table)).join(", ")
      const soft = def.softDelete ? ` AND "${def.softDelete}" IS NULL` : ""
      const rows = await query(
        `SELECT "id", ${cols} FROM "${def.table}" WHERE "id" = $1${soft} LIMIT 1`,
        [id],
      )
      return rows[0] ?? null
    },

    async getRaw(def, id) {
      const rows = await query(`SELECT * FROM "${def.table}" WHERE "id" = $1 LIMIT 1`, [id])
      return rows[0] ?? null
    },

    children(child, foreignKey, parentId, fields) {
      const cols = fields.map((f) => colExpr(f, child.table)).join(", ")
      const soft = child.softDelete ? ` AND "${child.softDelete}" IS NULL` : ""
      return query(
        `SELECT "id"${
          cols ? `, ${cols}` : ""
        } FROM "${child.table}" WHERE "${foreignKey}" = $1${soft} ORDER BY "id" LIMIT 50`,
        [parentId],
      )
    },

    async relationOptions(target: RelationTarget, labelField) {
      const soft = target.softDelete ? ` WHERE "${target.softDelete}" IS NULL` : ""
      const rows = await query(
        `SELECT "id"::text AS value, "${labelField}" AS label FROM "${target.table}"${soft} ORDER BY label LIMIT 500`,
      )
      return rows.map((o) => ({ value: String(o.value), label: String(o.label ?? o.value) }))
    },

    async create(def, values) {
      const cols = Object.keys(values)
      const created = cols.length
        ? await query(
          `INSERT INTO "${def.table}" (${cols.map((col) => `"${col}"`).join(", ")}) ` +
            `VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING "id"`,
          cols.map((col) => values[col]),
        )
        : await query(`INSERT INTO "${def.table}" DEFAULT VALUES RETURNING "id"`, [])
      return created[0]?.id != null ? String(created[0].id) : null
    },

    async update(def, id, values) {
      const cols = Object.keys(values)
      const sets = cols.map((col, i) => `"${col}" = $${i + 1}`).join(", ")
      await query(
        `UPDATE "${def.table}" SET ${sets} WHERE "id" = $${cols.length + 1}`,
        [...cols.map((col) => values[col]), id],
      )
    },

    async delete(def, id) {
      if (def.softDelete) {
        await query(`UPDATE "${def.table}" SET "${def.softDelete}" = now() WHERE "id" = $1`, [id])
      } else {
        await query(`DELETE FROM "${def.table}" WHERE "id" = $1`, [id])
      }
    },
  }
}
