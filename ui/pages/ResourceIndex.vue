<script setup lang="ts">
import { computed } from "vue"
import { router } from "@inertiajs/vue3"
import {
  PhCaretDown, PhCaretLeft, PhCaretRight, PhCaretUp, PhCaretUpDown, PhColumns,
  PhDotsThreeVertical, PhMagnifyingGlass, PhPlus,
} from "@phosphor-icons/vue"
import { Button } from "@forge/primitives/button"
import { Input } from "@forge/primitives/input"
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@forge/primitives/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@forge/primitives/select"
import {
  Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow,
} from "@forge/primitives/table"
import ConfirmDialog from "@forge/components/ConfirmDialog.vue"
import { confirmAction } from "@forge/confirm"
import { useForgeLayout } from "@forge/layout"
const Layout = useForgeLayout()
import { displayFor, type PublicField } from "@forge/fields"
import { navIcon } from "@forge/nav"
import { useResourceTable, type TablePagination, type TableSort } from "@forge/composables/useResourceTable"
import { useForgePrefix } from "@forge/prefix"
import { useForgeT } from "@forge/i18n"
const t = useForgeT()
const prefix = useForgePrefix()

interface ResourceMeta {
  name: string
  label: string
  fields: PublicField[]
}

interface ListAction {
  key: string
  label: string
  icon?: string
  variant: "default" | "outline" | "ghost" | "destructive" | "secondary"
  confirm?: string
  data?: Record<string, unknown>
  href: string
  link?: boolean
}

const props = defineProps<{
  resource: ResourceMeta
  rows: Record<string, unknown>[]
  q: string
  sort?: TableSort
  filters?: Record<string, string>
  pagination?: TablePagination
  canCreate?: boolean
  canWrite?: boolean
  canDelete?: boolean
  listActions?: ListAction[]
}>()

const table = useResourceTable(props.resource.name, {
  q: props.q,
  sort: props.sort,
  filters: props.filters,
  per: props.pagination?.per,
})
const { q, onSearch, sort, toggleSort, filters, setFilter, setPer, goTo, hidden, toggleColumn } = table

/** Colonnes visibles (masquage client, persisté). */
const visibleFields = computed(() => props.resource.fields.filter((f) => !hidden.value.has(f.key)))
/** Champs filtrables : ceux à options (badge / select). */
const filterableFields = computed(() => props.resource.fields.filter((f) => f.options?.length))

const from = computed(() => props.pagination ? (props.pagination.page - 1) * props.pagination.per + 1 : 1)
const to = computed(() => props.pagination ? Math.min(props.pagination.page * props.pagination.per, props.pagination.total) : props.rows.length)

async function remove(row: Record<string, unknown>) {
  if (await confirmAction(t("confirm.delete"))) {
    router.post(`${prefix}/${props.resource.name}/${row.id}/delete`)
  }
}

async function fireListAction(a: ListAction) {
  if (a.link) {
    router.visit(a.href)
    return
  }
  if (a.confirm && !(await confirmAction(a.confirm))) return
  router.post(a.href, a.data ?? {})
}
</script>

<template>
  <component :is="Layout">
    <ConfirmDialog />
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl">{{ resource.label }}</h1>
        <p class="text-sm text-muted-foreground">
          {{ t("index.count", { n: pagination?.total ?? rows.length }) }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative w-56 max-w-full">
          <PhMagnifyingGlass :size="16" class="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
          <Input v-model="q" :placeholder="t('index.search')" class="pl-9" @update:model-value="onSearch" />
        </div>

        <!-- Filtres facettés (champs à options), server-side -->
        <Select
          v-for="f in filterableFields"
          :key="f.key"
          :model-value="filters[f.key] ?? 'all'"
          @update:model-value="(v) => setFilter(f.key, v === 'all' ? '' : String(v))"
        >
          <SelectTrigger class="h-9 w-36" :class="filters[f.key] ? 'border-primary/50 text-foreground' : 'text-muted-foreground'">
            <SelectValue>{{ filters[f.key] ? f.options!.find(o => o.value === filters[f.key])?.label : f.label }}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ f.label }} : {{ t("index.filterAll") }}</SelectItem>
            <SelectItem v-for="o in f.options" :key="o.value" :value="o.value">{{ o.label }}</SelectItem>
          </SelectContent>
        </Select>

        <!-- Masquage de colonnes (client, persisté par resource) -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="icon" :aria-label="t('index.columns')"><PhColumns :size="16" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              v-for="f in resource.fields"
              :key="f.key"
              :model-value="!hidden.has(f.key)"
              @update:model-value="toggleColumn(f.key)"
              @select.prevent
            >
              {{ f.label }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button v-for="a in listActions" :key="a.key" :variant="a.variant" @click="fireListAction(a)">
          <component :is="navIcon(a.icon)" :size="16" /> {{ a.label }}
        </Button>
        <Button v-if="canCreate" @click="router.visit(`${prefix}/${resource.name}/create`)">
          <PhPlus :size="16" /> {{ t("actions.new") }}
        </Button>
      </div>
    </div>

    <div class="rounded-xl border bg-card/40">
      <Table>
        <TableHeader>
          <TableRow>
            <!-- En-têtes cliquables : asc → desc → aucun (tri server-side) -->
            <TableHead
              v-for="f in visibleFields"
              :key="f.key"
              class="cursor-pointer select-none hover:text-foreground"
              @click="toggleSort(f.key)"
            >
              <span class="inline-flex items-center gap-1">
                {{ f.label }}
                <PhCaretUp v-if="sort?.key === f.key && sort.dir === 'asc'" :size="12" class="text-primary" />
                <PhCaretDown v-else-if="sort?.key === f.key" :size="12" class="text-primary" />
                <PhCaretUpDown v-else :size="12" class="opacity-35" />
              </span>
            </TableHead>
            <TableHead class="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmpty v-if="!rows.length" :colspan="visibleFields.length + 1">{{ t("index.empty") }}</TableEmpty>
          <TableRow
            v-for="(row, i) in rows"
            :key="i"
            class="cursor-pointer"
            @click="router.visit(`${prefix}/${resource.name}/${row.id}`)"
          >
            <TableCell v-for="f in visibleFields" :key="f.key">
              <component :is="displayFor(f)" :field="f" :value="row[f.key]" />
            </TableCell>
            <TableCell class="w-10" @click.stop>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon-sm" :aria-label="t('actions.label')">
                    <PhDotsThreeVertical :size="18" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="router.visit(`${prefix}/${resource.name}/${row.id}`)">{{ t("actions.view") }}</DropdownMenuItem>
                  <DropdownMenuItem v-if="canWrite" @click="router.visit(`${prefix}/${resource.name}/${row.id}/edit`)">
                    {{ t("actions.edit") }}
                  </DropdownMenuItem>
                  <template v-if="canDelete">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem class="text-destructive data-[highlighted]:text-destructive" @click="remove(row)">
                      {{ t("actions.delete") }}
                    </DropdownMenuItem>
                  </template>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <!-- Pagination (server-side) -->
      <div v-if="pagination" class="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5 text-sm text-muted-foreground">
        <span>{{ pagination.total ? t("index.range", { from, to, total: pagination.total }) : t("index.rangeEmpty") }}</span>
        <div class="flex items-center gap-2">
          <Select :model-value="String(pagination.per)" @update:model-value="(v) => setPer(Number(v))">
            <SelectTrigger class="h-8 w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="n in [10, 25, 50, 100]" :key="n" :value="String(n)">{{ t("index.perPage", { n }) }}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon-sm" :disabled="pagination.page <= 1" :aria-label="t('index.prev')" @click="goTo(pagination.page - 1)">
            <PhCaretLeft :size="15" />
          </Button>
          <span class="tabular-nums">{{ pagination.page }} / {{ pagination.pages }}</span>
          <Button variant="outline" size="icon-sm" :disabled="pagination.page >= pagination.pages" :aria-label="t('index.next')" @click="goTo(pagination.page + 1)">
            <PhCaretRight :size="15" />
          </Button>
        </div>
      </div>
    </div>
  </component>
</template>
