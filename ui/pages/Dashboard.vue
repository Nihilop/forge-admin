<script setup lang="ts">
// Page DASHBOARD du kit — rend les widgets déclarés via defineWidget() :
// `stat` (chiffre-clé) et `list` (lignes, cliquables si `href`). Servie par le
// moteur à la racine du CRUD dès qu'un widget existe.
import { Link } from "@inertiajs/vue3"
import { Card, CardContent } from "@forge/primitives/card"
import { useForgeLayout } from "@forge/layout"
import { useForgeT } from "@forge/i18n"

const Layout = useForgeLayout()
const t = useForgeT()

interface Widget {
  key: string
  title: string
  type: "stat" | "list"
  span: number
  error?: boolean
  data?: {
    value?: string | number
    hint?: string
    items?: { label: string; value?: string | number; href?: string }[]
  }
}

defineProps<{ widgets: Widget[] }>()

const spanClass = (n: number) =>
  n >= 4 ? "lg:col-span-4" : n === 3 ? "lg:col-span-3" : n === 2 ? "lg:col-span-2" : ""
</script>

<template>
  <component :is="Layout">
    <h1 class="mb-4 text-2xl">{{ t("widgets.title") }}</h1>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card v-for="w in widgets" :key="w.key" :class="spanClass(w.span)">
        <CardContent class="space-y-2">
          <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {{ w.title }}
          </p>

          <p v-if="w.error" class="text-sm text-destructive">{{ t("widgets.error") }}</p>

          <!-- stat : chiffre-clé + tendance -->
          <template v-else-if="w.type === 'stat'">
            <p class="text-3xl font-semibold tracking-tight">{{ w.data?.value ?? "—" }}</p>
            <p v-if="w.data?.hint" class="text-xs text-muted-foreground">{{ w.data.hint }}</p>
          </template>

          <!-- list : lignes, cliquables si href -->
          <ul v-else class="divide-y">
            <li v-for="(item, i) in w.data?.items ?? []" :key="i">
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
            <li v-if="!(w.data?.items ?? []).length" class="py-2 text-sm text-muted-foreground">
              {{ t("show.empty") }}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </component>
</template>
