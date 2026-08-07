# Charts

Area / bar / line graphs (shadcn-vue's chart components, powered by
[Unovis](https://unovis.dev)). This is the building block of the [`chart`
widgets](../guide/widgets#chart-—-graph-area-bar-line) — reusable as-is in
your custom pages.

```vue
<script setup lang="ts">
import { AreaChart } from "@forge/primitives/chart-area"
// or: BarChart (@forge/primitives/chart-bar), LineChart (@forge/primitives/chart-line)

const data = [
  { month: "Jan", sales: 320, returns: 12 },
  { month: "Feb", sales: 410, returns: 9 },
  { month: "Mar", sales: 380, returns: 15 },
]
</script>

<template>
  <AreaChart :data="data" index="month" :categories="['sales', 'returns']" class="h-64" />
</template>
```

Common props (`BaseChartProps`): `data` (rows), `index` (X-axis key),
`categories` (series keys), `colors?`, `showLegend` / `showTooltip` /
`showXAxis` / `showYAxis` / `showGridLine`, `xFormatter` / `yFormatter`.

::: warning Weight
Unovis is a real dataviz library (~230 KB). The kit only loads it lazily
(`chart` widgets) — if you import these components in your own pages, do it
through `defineAsyncComponent` to keep the code-splitting.
:::
