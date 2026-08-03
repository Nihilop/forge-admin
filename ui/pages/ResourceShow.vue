<script setup lang="ts">
import { type Component, computed, ref } from "vue"
import { Link, router } from "@inertiajs/vue3"
import { PhArrowLeft, PhPencilSimple, PhPlus, PhTrash } from "@phosphor-icons/vue"
import { Button } from "@/primitives/button"
import { Card, CardContent } from "@/primitives/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/primitives/table"
import { DropdownMenuItem } from "@/primitives/dropdown-menu"
import OverflowRow from "@/OverflowRow.vue"
import ConfirmDialog from "@/components/ConfirmDialog.vue"
import { confirmAction } from "@/confirm"
import { useForgeLayout } from "@/layout"
const Layout = useForgeLayout()
import { displayFor, type PublicField } from "@/fields"
import { navIcon } from "@/nav"
import { useForgePrefix } from "@/prefix"
import { useForgeT } from "@/i18n"
const t = useForgeT()
const prefix = useForgePrefix()

interface ResourceMeta {
  name: string
  label: string
  fields: PublicField[]
}

interface HasMany {
  key: string
  label: string
  resource: string
  fields: PublicField[]
  rows: Record<string, unknown>[]
  canCreate?: boolean
  createHref?: string
}

interface ActionMeta {
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
  row: Record<string, unknown>
  canWrite: boolean
  canDelete?: boolean
  hasMany?: HasMany[]
  /** Sections hasMany en ONGLETS (option `tabs` de la resource). */
  tabs?: boolean
  actions?: ActionMeta[]
}>()

// Champs de la grille d'infos vs champs PLEINE LARGEUR (contenus longs).
const gridFields = computed(() => props.resource.fields.filter((f) => !f.wide))
const wideFields = computed(() => props.resource.fields.filter((f) => f.wide))

// Mode onglets : l'onglet actif (le premier par défaut). En mode empilé, toutes
// les sections sont visibles.
const activeTab = ref(props.hasMany?.[0]?.key ?? "")
const visibleSections = computed(() =>
  props.tabs ? (props.hasMany ?? []).filter((hm) => hm.key === activeTab.value) : (props.hasMany ?? []),
)

async function remove() {
  if (await confirmAction(t("confirm.delete"))) {
    router.post(`${prefix}/${props.resource.name}/${props.row.id}/delete`)
  }
}

async function fire(a: ActionMeta) {
  if (a.link) {
    router.visit(a.href)
    return
  }
  if (a.confirm && !(await confirmAction(a.confirm))) return
  router.post(a.href, a.data ?? {})
}

// Boutons d'en-tête unifiés (actions custom + Supprimer + Modifier) — passés à
// OverflowRow, qui pousse ceux qui débordent dans un dropdown « … ».
interface HeaderButton {
  key: string
  label: string
  icon: Component
  variant: "default" | "outline" | "ghost" | "destructive" | "secondary"
  danger?: boolean
  run: () => void
}
const headerButtons = computed<HeaderButton[]>(() => {
  const list: HeaderButton[] = (props.actions ?? []).map((a) => ({
    key: a.key,
    label: a.label,
    icon: navIcon(a.icon),
    variant: a.variant,
    run: () => fire(a),
  }))
  if (props.canDelete) {
    list.push({ key: "__delete", label: t("actions.delete"), icon: PhTrash, variant: "ghost", danger: true, run: remove })
  }
  if (props.canWrite) {
    list.push({
      key: "__edit",
      label: t("actions.edit"),
      icon: PhPencilSimple,
      variant: "outline",
      run: () => router.visit(`${prefix}/${props.resource.name}/${props.row.id}/edit`),
    })
  }
  return list
})

const tabClass = (key: string) =>
  activeTab.value === key
    ? "border-primary font-medium text-foreground"
    : "border-transparent text-muted-foreground hover:text-foreground"
</script>

<template>
  <component :is="Layout">
    <ConfirmDialog />
    <template #header-start>
      <Link
        :href="`${prefix}/${resource.name}`"
        class="my-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <PhArrowLeft :size="15" /> {{ resource.label }}
      </Link>
    </template>

    <Card>
      <CardContent>
        <div class="mb-6 flex items-center justify-between gap-3">
          <h1 class="shrink-0 text-2xl">{{ resource.label }} #{{ row.id }}</h1>
          <OverflowRow v-if="headerButtons.length" :items="headerButtons" :gap="8" align="end">
            <template #item="{ item }">
              <Button
                :variant="item.variant"
                size="sm"
                class="shrink-0 whitespace-nowrap"
                :class="item.danger ? 'text-destructive' : ''"
                @click="item.run()"
              >
                <component :is="item.icon" :size="15" /> {{ item.label }}
              </Button>
            </template>
            <template #menu-item="{ item }">
              <DropdownMenuItem :class="item.danger ? 'text-destructive' : ''" @click="item.run()">
                <component :is="item.icon" :size="15" /> {{ item.label }}
              </DropdownMenuItem>
            </template>
          </OverflowRow>
        </div>

        <dl class="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div v-for="f in gridFields" :key="f.key">
            <dt class="text-xs text-muted-foreground">{{ f.label }}</dt>
            <dd class="mt-0.5">
              <component :is="displayFor(f)" :field="f" :value="row[f.key]" />
            </dd>
          </div>
        </dl>

        <!-- Contenus longs (`wide`) : pleine largeur, sous la grille -->
        <div v-for="f in wideFields" :key="f.key" class="mt-6 border-t pt-4">
          <p class="mb-2 text-xs text-muted-foreground">{{ f.label }}</p>
          <component :is="displayFor(f)" :field="f" :value="row[f.key]" />
        </div>
      </CardContent>
    </Card>

    <!-- Mode onglets : barre de tabs (une section visible). Les onglets qui
         débordent passent dans un dropdown « … » (responsive). -->
    <div v-if="tabs && hasMany?.length" class="mt-6 border-b">
      <OverflowRow :items="hasMany" :gap="4" align="start">
        <template #item="{ item: hm }">
          <button
            type="button"
            class="-mb-px inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors"
            :class="tabClass(hm.key)"
            @click="activeTab = hm.key"
          >
            {{ hm.label }}
            <span class="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">{{ hm.rows.length }}</span>
          </button>
        </template>
        <template #menu-item="{ item: hm }">
          <DropdownMenuItem
            :class="activeTab === hm.key ? 'font-medium text-foreground' : ''"
            @click="activeTab = hm.key"
          >
            {{ hm.label }}
            <span class="ml-auto rounded-full bg-muted px-1.5 text-xs text-muted-foreground">{{ hm.rows.length }}</span>
          </DropdownMenuItem>
        </template>
      </OverflowRow>
    </div>

    <!-- Relations hasMany (records enfants), rows cliquables vers leur détail -->
    <Card v-for="hm in visibleSections" :key="hm.key" class="mt-4">
      <CardContent>
        <div class="mb-4 flex items-center justify-between gap-3">
          <h2 class="text-base font-medium">{{ hm.label }} ({{ hm.rows.length }})</h2>
          <Button v-if="hm.canCreate && hm.createHref" variant="outline" size="sm" @click="router.visit(hm.createHref)">
            <PhPlus :size="15" /> {{ t("actions.new") }}
          </Button>
        </div>
        <p v-if="!hm.rows.length" class="text-sm text-muted-foreground/70">{{ t("show.empty") }}</p>
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead v-for="f in hm.fields" :key="f.key">{{ f.label }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="(r, i) in hm.rows"
              :key="i"
              class="cursor-pointer"
              @click="router.visit(`${prefix}/${hm.resource}/${r.id}`)"
            >
              <TableCell v-for="f in hm.fields" :key="f.key">
                <component :is="displayFor(f)" :field="f" :value="r[f.key]" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </component>
</template>
