// Forge · moteur — définition des champs d'une resource. AGNOSTIQUE (aucun import
// spécifique-atlas). Les helpers produisent des `Field` typés ; le routeur les
// transforme en colonnes SQL, le kit Vue les transforme en composants.

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

export interface FieldOption {
  value: string
  label: string
  /** teinte du badge : success | warning | danger | primary | muted */
  tone?: "success" | "warning" | "danger" | "primary" | "muted"
}

export interface Field {
  key: string
  type: FieldType
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

function make(type: FieldType) {
  return (key: string, opts: Partial<Omit<Field, "key" | "type">> = {}): Field => ({
    key,
    type,
    label: opts.label ?? humanize(key),
    list: opts.list ?? true,
    ...opts,
  })
}

export const text = make("text")
export const email = make("email")
export const select = make("select")
export const badge = make("badge")
export const date = make("date")

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

/** Vue « publique » d'un champ envoyée au front (sans les détails serveur). */
export function publicField(f: Field) {
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
