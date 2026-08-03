// Forge · moteur — déclaration d'une resource + registre. AGNOSTIQUE.

import type { Field } from "./field.ts"
import { allPages } from "./page.ts"
import { forgePrefix } from "./prefix.ts"

/** Place d'une resource dans la nav (sidebar générée). */
export interface ForgeNav {
  /** Groupe / métier (id de workspace côté front). */
  group: string
  /** Libellé dans le menu (défaut : label de la resource). */
  label?: string
  /** Nom d'icône (résolu côté front). */
  icon?: string
  /** Ordre dans le groupe. */
  order?: number
}

/** Relation hasMany : enfants pointant vers cette resource (section du détail). */
export interface HasManyDef {
  /** Clé (id de la section). */
  key: string
  label?: string
  /** Resource enfant. */
  resource: string
  /** Colonne FK sur l'enfant qui pointe vers CETTE resource. */
  foreignKey: string
  /** Champs de l'enfant à afficher dans la mini-table. */
  columns: string[]
  /** Autorise la création d'un enfant scoped depuis ce détail (FK pré-remplie). */
  create?: boolean
}

/**
 * Action CUSTOM sur le détail : un bouton branché sur TON endpoint (POST). Forge
 * rend le bouton (gardé par permission + condition de visibilité), TU gères la
 * route. Ex. « Révoquer », « Lancer KYC ». Ne dépend de rien d'atlas-spécifique.
 */
export interface ActionDef {
  /** Id unique. */
  key: string
  label: string
  /** URL ; `:id` est remplacé par l'id de la ligne. POST par défaut, GET si `link`. */
  href: string
  /** Action « lien » : NAVIGUE (GET) vers `href` au lieu de POSTer (ex. ouvrir un
   *  form custom). Ignore `confirm`/`data`. */
  link?: boolean
  /** Nom d'icône (résolu côté front). */
  icon?: string
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary"
  /** Texte de confirmation avant de tirer (sinon pas de confirm). */
  confirm?: string
  /** Permission requise (défaut : `${policy}.write`). */
  permission?: string
  /** Corps POST envoyé à l'endpoint. */
  data?: Record<string, unknown>
  /** Visible seulement si la ligne remplit la condition (sinon toujours). */
  visibleWhen?: { field: string; equals?: unknown; notEquals?: unknown }
}

export interface ResourceDef {
  /** Slug dans l'URL : `<prefix>/:name` (préfixe : `ForgeContext.prefix`, défaut /admin). */
  name: string
  /** Table SQL. */
  table: string
  label: string
  /** Permission de base : `${policy}.read` / `${policy}.write`. OBLIGATOIRE —
   *  sans elle, la resource serait ouverte à tout opérateur authentifié. */
  policy: string
  /** Clés de champs cherchables (plein-texte ILIKE). */
  search?: string[]
  /** Clause ORDER BY (expression SQL, code-defined). Défaut : "id" DESC. */
  orderBy?: string
  /** Action « créer » activée. Défaut : true. */
  create?: boolean
  /** Action « supprimer » activée. Défaut : true. */
  delete?: boolean
  /** Colonne de soft-delete (sinon DELETE physique + masque les lignes supprimées). */
  softDelete?: string
  /** Place dans la sidebar (si présent, la resource apparaît dans le menu). */
  nav?: ForgeNav
  /** Relations hasMany affichées en sections sur le détail. */
  hasMany?: HasManyDef[]
  /** Détail : sections hasMany en ONGLETS (les champs restent toujours visibles).
   *  Défaut : empilées. */
  tabs?: boolean
  /** Actions custom (boutons) sur le détail, branchées sur tes endpoints. */
  actions?: ActionDef[]
  /** Actions custom sur la LISTE (à côté de « Nouveau ») : import, export…
   *  Même forme qu'`actions`, sans `:id` ni `visibleWhen` (pas de ligne). */
  listActions?: ActionDef[]
  /** Hooks métier (app-spécifiques). Le moteur les invoque, sans rien en savoir. */
  hooks?: {
    /** Après un INSERT réussi (y compris création scoped). */
    afterCreate?: (e: { id: string }) => void | Promise<void>
    /** Après un UPDATE réussi. `changed` = clés des champs dont la valeur a changé. */
    afterUpdate?: (e: { id: string; changed: string[] }) => void | Promise<void>
    /** Après un DELETE réussi (soft ou hard). `row` = état AVANT suppression. */
    afterDelete?: (e: { id: string; row: Record<string, unknown> | null }) => void | Promise<void>
  }
  fields: Field[]
}

export interface ForgeNavEntry {
  name: string
  href: string
  label: string
  group: string
  order: number
  icon?: string
  permission?: string
  /** Lien actif en match EXACT (pages custom type Dashboard). */
  exact?: boolean
}

/**
 * Menu unifié : entrées dérivées des resources (avec un `nav`) ⊕ des pages
 * custom (`definePage`). UNIQUE source de la sidebar — plus de doublon avec un
 * registre statique côté front.
 */
export function forgeNav(): ForgeNavEntry[] {
  const fromResources = allResources()
    .filter((r) => r.nav)
    .map((r): ForgeNavEntry => ({
      name: r.name,
      href: `${forgePrefix()}/${r.name}`,
      label: r.nav!.label ?? r.label,
      group: r.nav!.group,
      order: r.nav!.order ?? 0,
      icon: r.nav!.icon,
      permission: `${r.policy}.read`,
    }))
  const fromPages = allPages().map((p): ForgeNavEntry => ({
    name: p.name,
    href: p.href,
    label: p.nav.label ?? p.label,
    group: p.nav.group,
    order: p.nav.order ?? 0,
    icon: p.nav.icon,
    permission: p.permission,
    exact: p.exact,
  }))
  return [...fromResources, ...fromPages].sort((a, b) => a.order - b.order)
}

const registry = new Map<string, ResourceDef>()

export function defineResource(def: ResourceDef): ResourceDef {
  // Garde-fou : une resource sans policy serait lisible ET mutable par tout
  // opérateur authentifié. On refuse à l'enregistrement plutôt qu'en silence.
  if (!def.policy) {
    throw new Error(`Forge: la resource « ${def.name} » doit déclarer une "policy" (RBAC).`)
  }
  registry.set(def.name, def)
  return def
}

export function getResource(name: string): ResourceDef | undefined {
  return registry.get(name)
}

export function allResources(): ResourceDef[] {
  return [...registry.values()]
}
