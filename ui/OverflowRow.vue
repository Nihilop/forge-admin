<script setup lang="ts" generic="T">
// Rangée responsive « priority+ » : garde visibles les éléments qui tiennent, et
// pousse CEUX QUI DÉBORDENT dans un dropdown « … ». Recalcul sur onMounted, au
// chargement des polices, et à chaque resize (ResizeObserver). Générique : on
// fournit `items` + un slot #item (rendu inline) + #menu-item (rendu dropdown).
//
// Mesure : un « ghost » hors-flux, invisible, rend TOUS les items → on lit leurs
// largeurs réelles et on calcule combien tiennent (en réservant la place du « … »).
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/primitives/dropdown-menu"
import { Button } from "@/primitives/button"
import { PhDotsThree } from "@phosphor-icons/vue"
import { useForgeT } from "@/i18n"
const t = useForgeT()

const props = withDefaults(
  defineProps<{
    items: T[]
    /** Écart (px) entre éléments — doit refléter la classe `gap-*` utilisée. */
    gap?: number
    /** Alignement des éléments visibles. */
    align?: "start" | "end"
  }>(),
  { gap: 8, align: "start" },
)

defineSlots<{
  item(props: { item: T; index: number }): unknown
  "menu-item"(props: { item: T; index: number }): unknown
}>()

const root = ref<HTMLElement>()
const ghost = ref<HTMLElement>()
const visibleCount = ref(props.items.length)

const visibleItems = computed(() => props.items.slice(0, visibleCount.value))
const overflowItems = computed(() => props.items.slice(visibleCount.value))

const MORE_W = 44 // largeur réservée au bouton « … »

function measure() {
  const r = root.value
  const g = ghost.value
  if (!r || !g) return
  const avail = r.clientWidth
  const widths = Array.from(g.children).map((el) => (el as HTMLElement).offsetWidth)

  // Tout tient ? on montre tout, pas de « … ».
  let total = 0
  widths.forEach((w, i) => (total += w + (i > 0 ? props.gap : 0)))
  if (total <= avail) {
    visibleCount.value = props.items.length
    return
  }

  // Sinon : on remplit tant que ça rentre EN RÉSERVANT la place du « … ».
  const reserve = MORE_W + props.gap
  let used = 0
  let count = 0
  for (let i = 0; i < widths.length; i++) {
    const add = widths[i] + (i > 0 ? props.gap : 0)
    if (used + add + reserve <= avail) {
      used += add
      count++
    } else break
  }
  visibleCount.value = count
}

let ro: ResizeObserver | undefined
const onResize = () => measure()
onMounted(() => {
  nextTick(measure)
  // Les polices peuvent changer les largeurs après le 1er rendu.
  ;(document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts?.ready.then(() => measure())
  // ResizeObserver (changements de taille de l'élément) + resize fenêtre (filet).
  ro = new ResizeObserver(() => measure())
  if (root.value) ro.observe(root.value)
  globalThis.addEventListener("resize", onResize)
})
onBeforeUnmount(() => {
  ro?.disconnect()
  globalThis.removeEventListener("resize", onResize)
})
watch(() => props.items.length, () => nextTick(measure))
</script>

<template>
  <div
    ref="root"
    class="relative flex min-w-0 flex-1 items-center overflow-hidden"
    :class="align === 'end' ? 'justify-end' : 'justify-start'"
    :style="{ gap: `${gap}px` }"
  >
    <template v-for="(item, i) in visibleItems" :key="i">
      <slot name="item" :item="item" :index="i" />
    </template>

    <DropdownMenu v-if="overflowItems.length">
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" size="sm" class="shrink-0 px-2" :aria-label="t('actions.more')">
          <PhDotsThree :size="18" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <template v-for="(item, i) in overflowItems" :key="i">
          <slot name="menu-item" :item="item" :index="visibleCount + i" />
        </template>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- Ghost mesureur : hors-écran À GAUCHE (jamais de débordement à droite),
         invisible, rend TOUS les éléments pour lire leurs largeurs réelles. -->
    <div
      ref="ghost"
      aria-hidden="true"
      class="pointer-events-none invisible absolute top-0 flex flex-nowrap"
      :style="{ gap: `${gap}px`, left: '-9999px' }"
    >
      <div v-for="(item, i) in items" :key="i" class="shrink-0">
        <slot name="item" :item="item" :index="i" />
      </div>
    </div>
  </div>
</template>
