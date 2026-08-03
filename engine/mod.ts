/**
 * Forge engine — the agnostic CRUD core.
 *
 * Declare resources with {@linkcode defineResource}, mount the generated CRUD
 * with {@linkcode createForgeRouter}, and inject everything else (data through
 * a {@linkcode ForgeAdapter}, auth through `permissions`, rendering through
 * `render`) via the {@linkcode ForgeContext}. The engine depends on Hono only
 * and works headless — no assumption about your database, auth system or view
 * layer.
 *
 * For the batteries-included experience (Inertia rendering, assets, CSRF
 * guard, Postgres from a URL), use the `@streemkit/forge` root export instead.
 *
 * @example Declare a resource and mount the CRUD
 * ```ts
 * import { createForgeRouter, defineResource, postgresAdapter, text } from "@streemkit/forge/engine"
 *
 * defineResource({
 *   name: "products",
 *   table: "products",
 *   label: "Products",
 *   policy: "catalog",
 *   fields: [text("name", { editable: true, required: true })],
 * })
 *
 * const router = createForgeRouter({
 *   adapter: postgresAdapter({ query: (sql, params) => db.query(sql, params) }),
 *   permissions: () => Promise.resolve(["catalog.read", "catalog.write"]),
 *   render: (c, page, props) => myRender(c, page, props),
 *   renderErrors: (c, page, props, errors) => myRender(c, page, props, errors),
 *   redirect: (to) => Response.redirect(to, 303),
 * })
 * ```
 *
 * @module
 */

// Routeur CRUD générique
export { createForgeRouter, type ForgeContext } from "./router.ts"

// Contrat d'adapter de données + implémentation Postgres de référence
export type { ForgeAdapter, ListSelect, ListWhere, RelationTarget, Row } from "./adapter.ts"
export { postgresAdapter, type PostgresAdapterOptions } from "./adapters/postgres.ts"

// Nommage centralisé (brand.ts) + préfixe d'URL du CRUD
export {
  DEFAULT_ADMIN_PREFIX,
  FORGE_BRAND,
  FORGE_I18N_NS,
  FORGE_PAGE_NS,
  FORGE_STORAGE_NS,
  FORGE_TABLE_PREFIX,
  forgePage,
} from "./brand.ts"
export { forgePrefix, setForgePrefix } from "./prefix.ts"

// DSL de resource
export {
  type ActionDef,
  allResources,
  defineResource,
  type ForgeNav,
  forgeNav,
  type ForgeNavEntry,
  getResource,
  type HasManyDef,
  type ResourceDef,
} from "./resource.ts"

// DSL de champs
export {
  badge,
  belongsTo,
  date,
  email,
  type Field,
  type FieldFactory,
  type FieldOption,
  type FieldType,
  type PublicField,
  publicField,
  type Relation,
  select,
  text,
} from "./field.ts"

// Pages custom (au-delà du CRUD)
export { allPages, definePage, type PageDef } from "./page.ts"
