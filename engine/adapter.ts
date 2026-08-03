// Forge · moteur — contrat d'ADAPTER de données. Le routeur ne parle plus aucun
// dialecte de stockage : il exprime des INTENTIONS (compter, lister, lire,
// écrire) et l'adapter les traduit pour SON stockage. Postgres est fourni
// (adapters/postgres.ts) ; MySQL, SQLite, Mongo… = implémenter cette interface.
//
// Note : les expressions `column` / `writeColumn` / `orderBy` des defs sont
// SPÉCIFIQUES au stockage ciblé (une expression SQL pour un adapter SQL, un
// chemin de document pour un adapter NoSQL). Elles restent code-defined (jamais
// d'entrée utilisateur) et c'est l'adapter qui les interprète.

import type { Field } from "./field.ts"
import type { ResourceDef } from "./resource.ts"

/** A data row, as returned by adapters and passed to hooks. */
export type Row = Record<string, unknown>

/** Contraintes de sélection, déjà VALIDÉES par le routeur : `filters` ne
 *  contient que des valeurs présentes dans les `options` du champ, `q` ne
 *  s'applique qu'aux clés `def.search`. */
export interface ListWhere {
  /** Recherche plein-texte (sur `def.search`). */
  q?: string
  /** Filtres facettés (champ à options → valeur whitelistée). */
  filters?: { field: Field; value: string }[]
}

/** Full selection for {@linkcode ForgeAdapter.list}: constraints + projection,
 *  sorting and pagination. */
export interface ListSelect extends ListWhere {
  /** Champs à projeter (belongsTo → `{id,label}`). */
  fields: Field[]
  /** Tri demandé ; absent → `def.orderBy`, sinon défaut de l'adapter. */
  sort?: { field: Field; dir: "asc" | "desc" }
  /** Nombre max de lignes (taille de page). */
  limit: number
  /** Décalage de pagination. */
  offset: number
}

/** Cible d'une relation belongsTo (résolue par le routeur depuis le registre). */
export interface RelationTarget {
  /** Table (ou collection) de la resource cible. */
  table: string
  /** Colonne de soft-delete de la cible, si elle en a une. */
  softDelete?: string
}

/**
 * Le contrat que TOUT adapter implémente. Chaque méthode reçoit la `ResourceDef`
 * complète : l'adapter y lit `table`, `softDelete`, `orderBy` et les champs.
 * Les `values` d'écriture sont indexées par COLONNE D'ÉCRITURE (writeColumn /
 * colonne de FK / clé du champ), jamais par la clé d'affichage.
 */
export interface ForgeAdapter {
  /** Nombre de lignes satisfaisant `where` (pour la pagination). */
  count(def: ResourceDef, where: ListWhere): Promise<number>
  /** Lignes projetées sur `fields` (+ `id`), triées, paginées. */
  list(def: ResourceDef, select: ListSelect): Promise<Row[]>
  /** Une ligne projetée sur TOUS les champs de la def (+ `id`). `null` si
   *  absente ou soft-supprimée. */
  get(def: ResourceDef, id: string): Promise<Row | null>
  /** La ligne BRUTE, complète, SANS projection ni filtre soft-delete (état
   *  avant suppression pour les hooks — peut contenir des colonnes non
   *  déclarées dans la def). */
  getRaw(def: ResourceDef, id: string): Promise<Row | null>
  /** Enfants hasMany : lignes de `child` dont `foreignKey` vaut `parentId`,
   *  projetées sur `fields` (+ `id`). */
  children(
    child: ResourceDef,
    foreignKey: string,
    parentId: string,
    fields: Field[],
  ): Promise<Row[]>
  /** Options d'un belongsTo éditable : `{value,label}` des cibles disponibles
   *  (borné par l'adapter, trié par label). */
  relationOptions(
    target: RelationTarget,
    labelField: string,
  ): Promise<{ value: string; label: string }[]>
  /** Crée une ligne ; renvoie l'id créé (`null` si le stockage ne le fournit
   *  pas). `values` vide = ligne aux valeurs par défaut. */
  create(def: ResourceDef, values: Row): Promise<string | null>
  /** Met à jour les colonnes de `values` (jamais appelé avec `values` vide). */
  update(def: ResourceDef, id: string, values: Row): Promise<void>
  /** Supprime — SOFT si `def.softDelete` est défini, sinon définitivement. */
  delete(def: ResourceDef, id: string): Promise<void>
}
