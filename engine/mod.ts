// Forge · moteur — API PUBLIQUE. Point d'import unique pour les consommateurs
// (l'admin AIOS, l'app exemple dev/, tout futur back-office). Le moteur est
// AGNOSTIQUE : données (adapter), auth (permissions), rendu (render) et
// redirection sont INJECTÉS via ForgeContext → il ne dépend que de Hono.

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
  type FieldOption,
  type FieldType,
  publicField,
  type Relation,
  select,
  text,
} from "./field.ts"

// Pages custom (au-delà du CRUD)
export { allPages, definePage, type PageDef } from "./page.ts"
