<script setup lang="ts">
// Carte WIDGET — le rendu partagé des widgets defineWidget() : `stat`
// (chiffre-clé), `list` (lignes cliquables) et `chart` (Unovis, lazy).
// Consommée par la page Dashboard ET par l'index des resources (metrics).
import { computed, defineAsyncComponent } from "vue"
import { Link } from "@inertiajs/vue3"
import { Card, CardContent } from "@forge/primitives/card"
import { useForgeT } from "@forge/i18n"

// Unovis (lourd) : chargé UNIQUEMENT si un widget chart est affiché.
const WidgetChart = defineAsyncComponent(() => import("./WidgetChart.vue"))

export interface WidgetView {
  key: string
  title: string
  type: "stat" | "list" | "chart"
  chart?: "area" | "bar" | "line"
  span: number
  error?: boolean
  data?: {
    value?: string | number
    hint?: string
    items?: { label: string; value?: string | number; href?: string }[]
    categories?: (string | number)[]
    series?: { name: string; values: number[] }[]
  }
}

const props = defineProps<{ widget: WidgetView }>()
const t = useForgeT()

const spanClass = computed(() => {
  const n = props.widget.span
  return n >= 4 ? "lg:col-span-4" : n === 3 ? "lg:col-span-3" : n === 2 ? "lg:col-span-2" : ""
})

const chartData = computed(() => ({
  categories: props.widget.data?.categories ?? [],
  series: props.widget.data?.series ?? [],
}))
</script>

<template>
  <Card :class="spanClass">
    <CardContent class="space-y-2">
      <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {{ widget.title }}
      </p>

      <p v-if="widget.error" class="text-sm text-destructive">{{ t("widgets.error") }}</p>

      <!-- stat : chiffre-clé + tendance -->
      <template v-else-if="widget.type === 'stat'">
        <p class="text-3xl font-semibold tracking-tight">{{ widget.data?.value ?? "—" }}</p>
        <p v-if="widget.data?.hint" class="text-xs text-muted-foreground">{{ widget.data.hint }}</p>
      </template>

      <!-- chart : area / bar / line (Unovis, chargé à la demande) -->
      <WidgetChart
        v-else-if="widget.type === 'chart'"
        :chart="widget.chart ?? 'area'"
        :data="chartData"
      />

      <!-- list : lignes, cliquables si href -->
      <ul v-else class="divide-y">
        <li v-for="(item, i) in widget.data?.items ?? []" :key="i">
          <component
            :is="item.href ? Link : 'div'"
            :href="item.href"
            class="flex items-center justify-between gap-3 py-2 text-sm"
            :class="item.href ? 'hover:text-primary' : ''"
          >
            <span class="truncate">{{ item.label }}</span>
            <span v-if="item.value !== undefined" class="shrink-0 text-muted-foreground">
              {{ item.value }}
            </span>
          </component>
        </li>
        <li v-if="!(widget.data?.items ?? []).length" class="py-2 text-sm text-muted-foreground">
          {{ t("show.empty") }}
        </li>
      </ul>
    </CardContent>
  </Card>
</template>
