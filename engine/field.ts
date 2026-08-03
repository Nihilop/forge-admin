// Forge · moteur — définition des champs d'une resource. AGNOSTIQUE (aucun import
// spécifique-atlas). Les helpers produisent des `Field` typés ; le routeur les
// transforme en colonnes SQL, le kit Vue les transforme en composants.

/** The built-in field kinds (each has a matching helper: `text()`, `badge()`…). */
export type FieldType = "text" | "email" | "select" | "badge" | "date" | "belongsTo"

/** Relation belongsTo : clé étrangère vers une autre resource. */
export interface Relation {
  /** Nom de la resource liée. */
  resource: string
  /** Colonne FK dans la table de CETTE resource. */
  column: string
  /** Champ de la resource liée à afficher (le « libellé »). */
  labelField: string
}

/** One choice of a `select`/`badge` field. Submitted values are validated against these. */
export interface FieldOption {
  /** Stored value. */
  value: string
  /** Displayed label. */
  label: string
  /** teinte du badge : success | warning | danger | primary | muted */
  tone?: "success" | "warning" | "danger" | "primary" | "muted"
}

/** A resource field: how one column is displayed (list + detail) and edited (form).
 *  Create them with the typed helpers ({@linkcode text}, {@linkcode badge},
 *  {@linkcode belongsTo}…) rather than by hand. */
export interface Field {
  /** Field key (also the default column, and the prop key sent to the frontend). */
  key: string
  /** Field kind — drives the display and input components. */
  type: FieldType
  /** Display label. */
  label: string
  /** Colonne ou EXPRESSION SQL d'AFFICHAGE (code-defined, donc sûre). Défaut : "key". */
  column?: string
  /** Colonne d'ÉCRITURE si différente de l'affichage (ex. `column` est une
   *  expression non writable comme `dob::text`, on écrit dans `dob`). */
  writeColumn?: string
  /** Visible dans la liste. Défaut : true. */
  list?: boolean
  /** Détail : affiché PLEINE LARGEUR sous la grille d'infos (contenus longs). */
  wide?: boolean
  /** Inclus dans la recherche plein-texte. */
  searchable?: boolean
  /** Options (select/badge). */
  options?: FieldOption[]
  /** Composant d'affichage custom enregistré côté front (escape hatch). */
  display?: string
  /** Éditable dans le formulaire (défaut : false → lecture seule). */
  editable?: boolean
  /** Requis à la saisie. */
  required?: boolean
  /** Composant de saisie custom enregistré côté front (escape hatch). */
  input?: string
  /** Métadonnées de relation (type belongsTo). */
  relation?: Relation
  /** Permission requise pour ÉDITER ce champ. Sinon il est verrouillé dans le
   *  formulaire ET ignoré côté serveur (jamais juste masqué). */
  permission?: string
}

function humanize(k: string): string {
  return k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())
}

/** Signature d'un helper de champ (`text`, `badge`…). */
export type FieldFactory = (key: string, opts?: Partial<Omit<Field, "key" | "type">>) => Field

function make(type: FieldType): FieldFactory {
  return (key, opts = {}) => ({
    key,
    type,
    label: opts.label ?? humanize(key),
    list: opts.list ?? true,
    ...opts,
  })
}

/** Short text field (labels, references…). */
export const text: FieldFactory = make("text")
/** Email field — validated in the form. */
export const email: FieldFactory = make("email")
/** Dropdown field (requires `options`). */
export const select: FieldFactory = make("select")
/** Colored enum field (`options` + `tone`) — automatically filterable in lists. */
export const badge: FieldFactory = make("badge")
/** Timestamp field — provide an epoch-ms `column` expression, the frontend formats it. */
export const date: FieldFactory = make("date")

/** Champ belongsTo : FK vers une autre resource (affichée en lien, éditée en select). */
export function belongsTo(
  key: string,
  opts: Relation & Partial<Omit<Field, "key" | "type" | "relation">>,
): Field {
  const { resource, column, labelField, ...rest } = opts
  return {
    key,
    type: "belongsTo",
    label: rest.label ?? humanize(key),
    list: rest.list ?? true,
    relation: { resource, column, labelField },
    editable: rest.editable,
    required: rest.required,
    display: rest.display,
    input: rest.input,
    permission: rest.permission,
  }
}

/** Forme « publique » d'un champ, envoyée au front (sans les détails serveur :
 *  ni `column`/`writeColumn`, ni `permission`). */
export interface PublicField {
  /** Field key (prop key of the row values). */
  key: string
  /** Field kind. */
  type: FieldType
  /** Display label. */
  label: string
  /** Choices (`select`/`badge`), or resolved targets for an editable `belongsTo`. */
  options?: FieldOption[]
  /** Registered custom display component name. */
  display?: string
  /** Registered custom input component name. */
  input?: string
  /** Editable in the form. */
  editable: boolean
  /** Required on input. */
  required: boolean
  /** belongsTo metadata. */
  relation?: Relation
  /** Full-width rendering (detail + form). */
  wide: boolean
}

/** Vue « publique » d'un champ envoyée au front (sans les détails serveur). */
export function publicField(f: Field): PublicField {
  return {
    key: f.key,
    type: f.type,
    label: f.label,
    options: f.options,
    display: f.display,
    input: f.input,
    editable: f.editable ?? false,
    required: f.required ?? false,
    relation: f.relation,
    wide: f.wide ?? false,
  }
}
