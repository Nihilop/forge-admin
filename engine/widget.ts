// Forge · moteur — WIDGETS du dashboard. Déclaratif comme le reste : chaque
// widget porte son résolveur de données (écrit par l'hôte, qui referme sur SA
// couche d'accès), le moteur les résout par requête (permissions comprises) et
// le kit les rend sur `forge/Dashboard` — servie à la RACINE du CRUD dès qu'au
// moins un widget est déclaré (sinon : redirection vers la première entrée de
// nav, comportement historique). AGNOSTIQUE.

/** Payload attendu d'un widget `stat` (carte chiffre-clé). */
export interface StatWidgetData {
  /** La valeur mise en avant (déjà formatée : "12 430 €", 42…). */
  value: string | number
  /** Ligne secondaire (tendance, période…). */
  hint?: string
}

/** Payload attendu d'un widget `list` (carte liste : derniers éléments…). */
export interface ListWidgetData {
  /** Lignes de la carte. `href` → la ligne devient un lien (Inertia). */
  items: { label: string; value?: string | number; href?: string }[]
}

/** Payload attendu d'un widget `chart` (courbes/aires/barres, multi-séries). */
export interface ChartWidgetData {
  /** Libellés de l'axe X (un par point). */
  categories: (string | number)[]
  /** Séries — `values` aligné sur `categories` (une valeur par point). */
  series: { name: string; values: number[] }[]
}

/** The declaration of a dashboard widget — see {@linkcode defineWidget}. */
export interface WidgetDef {
  /** Id unique. */
  key: string
  /** Titre de la carte. */
  title: string
  /** Rendu : `stat` (chiffre-clé), `list` (lignes) ou `chart` (graphique). */
  type: "stat" | "list" | "chart"
  /** Variante d'un widget `chart`. Défaut : `area`. */
  chart?: "area" | "bar" | "line"
  /** Ordre d'affichage (croissant). Défaut : ordre de déclaration. */
  order?: number
  /** Largeur en colonnes de la grille (1 à 4).
   *  Défaut : `1` (les `list` et `chart` : 2). */
  span?: number
  /** Permission requise pour VOIR le widget (sinon : visible de tous). */
  permission?: string
  /** Scope le widget sur l'INDEX d'une resource (metric de modèle, façon
   *  Nova) : rendu AU-DESSUS du tableau de `<prefix>/<resource>` au lieu du
   *  dashboard. Absent → widget du dashboard (racine du CRUD). */
  resource?: string
  /** Résolveur de données, exécuté par REQUÊTE côté serveur. Renvoie un
   *  {@linkcode StatWidgetData}, {@linkcode ListWidgetData} ou
   *  {@linkcode ChartWidgetData} selon `type`. Une erreur n'abat pas la
   *  page : la carte affiche un état d'erreur. */
  data: () => Promise<unknown> | unknown
}

const widgets = new Map<string, WidgetDef>()

/** Declares a dashboard widget. As soon as one widget exists, the CRUD root
 *  (`GET <prefix>`) renders the `forge/Dashboard` page instead of redirecting
 *  to the first nav entry. Data is resolved per request, permission-filtered. */
export function defineWidget(def: WidgetDef): WidgetDef {
  widgets.set(def.key, def)
  return def
}

/** Every registered widget, in declaration order. */
export function allWidgets(): WidgetDef[] {
  return [...widgets.values()]
}
