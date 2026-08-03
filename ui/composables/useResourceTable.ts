// Forge · kit Vue — état de la DataTable (recherche · tri · filtres · pagination,
// TOUT server-side via reloads partiels Inertia) + masquage de colonnes (client,
// persisté par resource). La page n'est qu'un renderer.

import { computed, ref, watch } from "vue"
import { router } from "@inertiajs/vue3"
import { FORGE_STORAGE_NS } from "../brand"
import { useForgePrefix } from "../prefix"

export interface TableSort {
  key: string
  dir: "asc" | "desc"
}
export interface TablePagination {
  page: number
  per: number
  total: number
  pages: number
}

const RELOAD_PROPS = ["rows", "q", "sort", "filters", "pagination"]

export function useResourceTable(
  resourceName: string,
  initial: { q?: string; sort?: TableSort; filters?: Record<string, string>; per?: number } = {},
) {
  const prefix = useForgePrefix()
  const q = ref(initial.q ?? "")
  const sort = ref<TableSort>(initial.sort ?? { key: "", dir: "desc" })
  const filters = ref<Record<string, string>>({ ...(initial.filters ?? {}) })
  const per = ref(initial.per ?? 25)

  /** Reload partiel avec l'état courant (page 1 sauf navigation explicite). */
  function load(page = 1) {
    const params: Record<string, string | number> = { q: q.value, page, per: per.value }
    if (sort.value.key) {
      params.sort = sort.value.key
      params.dir = sort.value.dir
    }
    for (const [key, value] of Object.entries(filters.value)) {
      if (value) params[`f_${key}`] = value
    }
    router.get(`${prefix}/${resourceName}`, params, {
      only: RELOAD_PROPS,
      preserveState: true,
      preserveScroll: true,
      replace: true,
    })
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  function onSearch() {
    clearTimeout(timer)
    timer = setTimeout(() => load(1), 250)
  }

  /** Clic sur un en-tête : asc → desc → aucun tri. */
  function toggleSort(key: string) {
    if (sort.value.key !== key) sort.value = { key, dir: "asc" }
    else if (sort.value.dir === "asc") sort.value = { key, dir: "desc" }
    else sort.value = { key: "", dir: "desc" }
    load(1)
  }

  function setFilter(key: string, value: string) {
    if (value) filters.value[key] = value
    else delete filters.value[key]
    load(1)
  }

  function goTo(page: number) {
    load(page)
  }

  function setPer(value: number) {
    per.value = value
    load(1)
  }

  // ── Masquage de colonnes : purement CLIENT, persisté par resource. ──
  const storageKey = `${FORGE_STORAGE_NS}:${resourceName}:hidden-cols`
  const hidden = ref<Set<string>>(new Set())
  try {
    hidden.value = new Set(JSON.parse(localStorage.getItem(storageKey) ?? "[]"))
  } catch { /* stockage indisponible */ }
  watch(hidden, (v) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...v]))
    } catch { /* idem */ }
  }, { deep: true })

  function toggleColumn(key: string) {
    if (hidden.value.has(key)) hidden.value.delete(key)
    else hidden.value.add(key)
  }
  const isVisible = computed(() => (key: string) => !hidden.value.has(key))

  return {
    q,
    onSearch,
    sort,
    toggleSort,
    filters,
    setFilter,
    per,
    setPer,
    goTo,
    hidden,
    toggleColumn,
    isVisible,
  }
}
