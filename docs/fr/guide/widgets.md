# Widgets du dashboard

Déclarez des **widgets** et Forge compose votre page d'accueil : dès qu'au
moins un widget existe, la racine de l'admin (`GET <prefix>`) rend un
**dashboard** au lieu de rediriger vers la première entrée du menu. C'est
aussi la page d'atterrissage après login.

```ts
import { defineWidget } from "@streemkit/forge/engine"

defineWidget({
  key: "products-active",
  title: "Produits actifs",
  type: "stat",
  order: 1,
  data: async () => {
    const [s] = await query(`SELECT COUNT(*)::int AS n FROM products WHERE status = 'active'`)
    return { value: s.n, hint: "sur le catalogue" }
  },
})
```

Le résolveur `data` est écrit par **vous** (il referme sur votre couche
d'accès — pool, ORM, fetch…) et exécuté par le moteur **à chaque requête**.

## Les trois types

### `stat` — chiffre-clé

`data` renvoie `{ value, hint? }` :

```ts
defineWidget({
  key: "revenue",
  title: "Chiffre d'affaires",
  type: "stat",
  data: async () => ({ value: "12 430 €", hint: "+8 % ce mois" }),
})
```

### `list` — liste de lignes

`data` renvoie `{ items: [{ label, value?, href? }] }` — une ligne avec
`href` devient un **lien** (navigation Inertia) :

```ts
defineWidget({
  key: "latest-orders",
  title: "Dernières commandes",
  type: "list",
  data: async () => ({
    items: (await lastOrders()).map((o) => ({
      label: o.customer,
      value: `×${o.qty}`,
      href: `/admin/orders/${o.id}`,
    })),
  }),
})
```

### `chart` — graphique (area, bar, line)

`data` renvoie `{ categories, series }` — `categories` sont les libellés de
l'axe X, chaque série aligne une valeur par point. Multi-séries : la légende
apparaît automatiquement.

```ts
defineWidget({
  key: "orders-week",
  title: "Commandes (7 jours)",
  type: "chart",
  chart: "area", // "area" (défaut) | "bar" | "line"
  data: async () => ({
    categories: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    series: [
      { name: "Payées", values: [4, 6, 3, 8, 5, 9, 7] },
      { name: "En attente", values: [1, 2, 1, 3, 2, 1, 0] },
    ],
  }),
})
```

Les graphiques s'appuient sur les composants charts de shadcn-vue (Unovis) et
suivent le thème (tokens `--chart-1…5`). La lib de charts est **chargée à la
demande** (code-splitting) : un admin sans widget `chart` ne télécharge
jamais Unovis.

## Metrics de resource (`resource`)

Un widget peut être **scopé sur une resource** : il est alors rendu
**au-dessus du tableau** de sa liste (`<prefix>/<resource>`) au lieu du
dashboard — le pattern « metrics » de Nova. Même API, mêmes types, mêmes
permissions :

```ts
defineWidget({
  key: "products-stock",
  title: "Stock total",
  type: "stat",
  resource: "products", // ← rendu sur /admin/products
  data: async () => {
    const [s] = await query(`SELECT COALESCE(SUM(stock), 0)::int AS n FROM products`)
    return { value: s.n }
  },
})
```

## Les options (`WidgetDef`)

| Option | Rôle |
|---|---|
| `key` | Id unique. |
| `title` | Titre de la carte. |
| `type` | `stat`, `list` ou `chart`. |
| `chart` | Variante d'un `chart` : `area` (défaut), `bar`, `line`. |
| `order` | Ordre d'affichage (croissant). |
| `span` | Largeur en colonnes de la grille (1 à 4). Défaut : `1` (`2` pour `list` et `chart`). |
| `permission` | Permission requise pour **voir** le widget — entre dans le [catalogue dynamique](permissions) de la page rôles. |
| `resource` | Scope le widget sur l'**index d'une resource** (metric de modèle) au lieu du dashboard. |
| `data` | Résolveur de données, par requête. |

## Robustesse

- Un résolveur qui **casse** n'abat pas le dashboard : sa carte affiche un
  état d'erreur, les autres continuent de vivre.
- Les widgets gated par `permission` disparaissent pour les opérateurs qui ne
  l'ont pas — côté serveur (jamais envoyés).

::: tip Menu
Le dashboard n'ajoute pas d'entrée de menu tout seul — pointez-en une avec
[`definePage`](pages) : `definePage({ name: "dash", href: "/admin", label:
"Dashboard", nav: { … }, exact: true })`.
:::
