# Charts

Graphiques area / bar / line (composants charts de shadcn-vue, moteur
[Unovis](https://unovis.dev)). C'est la brique des [widgets
`chart`](../guide/widgets#chart-—-graphique-area-bar-line) — réutilisable
telle quelle dans vos pages custom.

```vue
<script setup lang="ts">
import { AreaChart } from "@forge/primitives/chart-area"
// ou : BarChart (@forge/primitives/chart-bar), LineChart (@forge/primitives/chart-line)

const data = [
  { mois: "Jan", ventes: 320, retours: 12 },
  { mois: "Fév", ventes: 410, retours: 9 },
  { mois: "Mar", ventes: 380, retours: 15 },
]
</script>

<template>
  <AreaChart :data="data" index="mois" :categories="['ventes', 'retours']" class="h-64" />
</template>
```

Props communes (`BaseChartProps`) : `data` (lignes), `index` (clé de l'axe X),
`categories` (clés des séries), `colors?`, `showLegend` / `showTooltip` /
`showXAxis` / `showYAxis` / `showGridLine`, `xFormatter` / `yFormatter`.

::: warning Poids
Unovis est une vraie lib de dataviz (~230 Ko). Le kit ne la charge que
paresseusement (widgets `chart`) — si vous importez ces composants dans vos
pages, faites-le via `defineAsyncComponent` pour garder le code-splitting.
:::
