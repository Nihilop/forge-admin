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

## Les deux types

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

## Les options (`WidgetDef`)

| Option | Rôle |
|---|---|
| `key` | Id unique. |
| `title` | Titre de la carte. |
| `type` | `stat` ou `list`. |
| `order` | Ordre d'affichage (croissant). |
| `span` | Largeur en colonnes de la grille (1 à 4). Défaut : `1` (`2` pour les `list`). |
| `permission` | Permission requise pour **voir** le widget — entre dans le [catalogue dynamique](permissions) de la page rôles. |
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
