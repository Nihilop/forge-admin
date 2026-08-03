# Pages : auto-générées vs custom

## Les pages CRUD sont auto-générées

Vous ne les écrivez **jamais**. Déclarer une resource crée liste, fiche et
formulaires — voir [Resources](resources).

## Les pages custom sont à vous

Pour tout ce qui n'est pas du CRUD (dashboard, monitoring, page d'aide…), vous
écrivez **la route et le composant** ; `definePage` sert uniquement à ajouter
l'entrée dans la **sidebar** de Forge (menu unifié).

### 1. Déclarer l'entrée de menu (serveur)

```ts
import { definePage } from "forge/engine"

definePage({
  name: "dashboard",
  href: "/",                 // VOTRE route (Forge ne la rend pas)
  label: "Vue d'ensemble",
  nav: { group: "Général", icon: "gauge", order: 0 },
  permission: "dashboard.read",  // masque l'entrée sans cette permission
  exact: true,               // lien actif en match EXACT de l'URL
})
```

| Option | Rôle |
|---|---|
| `name` | Id unique. |
| `href` | **Votre** route. |
| `label` / `nav` | Libellé + place dans la sidebar (`group`, `icon`, `order`). |
| `permission` | Permission requise pour voir l'entrée. |
| `exact` | Actif en match exact (sinon préfixe) — indispensable pour `/`. |

### 2. Écrire la route (app)

```ts
admin.app.get("/", async (c) =>
  admin.render(c, "Dashboard", { stats: await stats() }))
```

`admin.render` rend une page de **votre** app — le resolver du front la
cherchera hors du namespace Forge (voir [Kit frontend](frontend)).

### 3. Écrire le composant

```vue
<!-- src/pages/Dashboard.vue -->
<script setup lang="ts">
import { Link } from "@inertiajs/vue3"
import { Card, CardContent } from "@/primitives/card"
import { useForgeLayout } from "@/layout"
import { useForgePrefix } from "@/prefix"

const Layout = useForgeLayout()      // votre chrome, injecté
const prefix = useForgePrefix()      // jamais de "/admin" en dur

defineProps<{ stats: { orders: number; pending: number } }>()
</script>

<template>
  <component :is="Layout">
    <h1 class="text-2xl">Vue d'ensemble</h1>
    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      <Card>
        <CardContent>
          <p class="text-xs text-muted-foreground">Commandes</p>
          <p class="mt-1 text-3xl font-semibold tabular-nums">{{ stats.orders }}</p>
          <Link :href="`${prefix}/orders`" class="text-xs hover:underline">Voir la liste</Link>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <p class="text-xs text-muted-foreground">En attente</p>
          <p class="mt-1 text-3xl font-semibold tabular-nums">{{ stats.pending }}</p>
          <!-- Deep-link vers la liste FILTRÉE (filtres facettés server-side) -->
          <Link :href="`${prefix}/orders?f_status=pending`" class="text-xs hover:underline">Voir</Link>
        </CardContent>
      </Card>
    </div>
  </component>
</template>
```

::: tip Deep-links vers les listes
Les états de liste sont dans l'URL : `?q=…` (recherche), `?f_<champ>=<valeur>`
(filtre facetté), `?sort=<champ>&dir=asc|desc`, `?page=…&per=…`. Vos pages
custom peuvent pointer directement vers une vue filtrée.
:::

## Le menu unifié

La sidebar est l'union : entrées des **resources** (celles qui ont `nav`) ⊕
entrées **`definePage`** — triées par `order`, groupées par `group`, filtrées
par permission. Côté serveur, `forgeNav()` la génère ; la façade la partage à
toutes les pages sous la prop `forge.nav`, et votre layout la rend comme il
veut (voir [Kit frontend](frontend)).
