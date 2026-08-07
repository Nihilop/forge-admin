<script setup lang="ts">
// Page DASHBOARD du kit — rend les widgets déclarés via defineWidget() (ceux
// SANS `resource`). Servie par le moteur à la racine du CRUD dès qu'un widget
// existe. Le rendu des cartes est partagé avec l'index des resources
// (metrics) : components/WidgetCard.vue.
import WidgetCard, { type WidgetView } from "@forge/components/WidgetCard.vue"
import { useForgeLayout } from "@forge/layout"
import { useForgeT } from "@forge/i18n"

const Layout = useForgeLayout()
const t = useForgeT()

defineProps<{ widgets: WidgetView[] }>()
</script>

<template>
  <component :is="Layout">
    <h1 class="mb-4 text-2xl">{{ t("widgets.title") }}</h1>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <WidgetCard v-for="w in widgets" :key="w.key" :widget="w" />
    </div>
  </component>
</template>
