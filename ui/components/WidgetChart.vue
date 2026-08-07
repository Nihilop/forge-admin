<script setup lang="ts">
// Rendu des widgets `chart` — composants shadcn-vue (Unovis). Ce fichier est
// importé DYNAMIQUEMENT par WidgetCard (defineAsyncComponent) : Unovis (lourd)
// n'entre dans le bundle chargé que si un chart est effectivement affiché.
import { computed } from "vue"
import { AreaChart } from "@forge/primitives/chart-area"
import { BarChart } from "@forge/primitives/chart-bar"
import { LineChart } from "@forge/primitives/chart-line"

interface ChartData {
  categories: (string | number)[]
  series: { name: string; values: number[] }[]
}

const props = defineProps<{ chart: "area" | "bar" | "line"; data: ChartData }>()

// ChartWidgetData → lignes Unovis : une ligne par point, une clé par série.
const rows = computed(() =>
  props.data.categories.map((c, i) => {
    const row: Record<string, unknown> = { x: c }
    for (const s of props.data.series) row[s.name] = s.values[i] ?? 0
    return row
  })
)
const names = computed(() => props.data.series.map((s) => s.name))

// Couleurs CONCRÈTES depuis les tokens --chart-* du thème (les attributs SVG
// des gradients ne résolvent pas var()) — résolues de façon SYNCHRONE : le
// composant chart fige les couleurs de sa légende au setup, un onMounted
// arriverait trop tard (pastilles noires). Toujours client-side (chunk async).
const RAMP_ORDER = [3, 1, 5, 2, 4]
const colors = computed<string[] | undefined>(() => {
  if (typeof document === "undefined") return undefined
  const styles = getComputedStyle(document.documentElement)
  const ramp = RAMP_ORDER
    .map((n) => styles.getPropertyValue(`--chart-${n}`).trim())
    .filter(Boolean)
  return ramp.length ? names.value.map((_, i) => ramp[i % ramp.length]) : undefined
})

const component = computed(() =>
  props.chart === "bar" ? BarChart : props.chart === "line" ? LineChart : AreaChart
)
</script>

<template>
  <component
    :is="component"
    :data="rows"
    index="x"
    :categories="names"
    :colors="colors"
    :show-legend="names.length > 1"
    class="h-48"
  />
</template>
