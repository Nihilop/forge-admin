<script setup lang="ts">
// Page système « Rôles & permissions » — rendue par le module d'auth builtin
// sous le nom "forge/Roles". La grille de permissions est DYNAMIQUE : elle se
// construit depuis le `catalog` envoyé par le serveur (déduit des resources,
// champs, actions et pages de l'app hôte).
import { computed, ref, watch } from "vue"
import { router } from "@inertiajs/vue3"
import { PhPlus, PhTrash } from "@phosphor-icons/vue"
import { Badge } from "@forge/primitives/badge"
import { Button } from "@forge/primitives/button"
import { Card, CardContent } from "@forge/primitives/card"
import { Checkbox } from "@forge/primitives/checkbox"
import { Input } from "@forge/primitives/input"
import { Label } from "@forge/primitives/label"
import { Switch } from "@forge/primitives/switch"
import ConfirmDialog from "@forge/components/ConfirmDialog.vue"
import { confirmAction } from "@forge/confirm"
import { useForgeLayout } from "@forge/layout"
import { useForgeT } from "@forge/i18n"
const Layout = useForgeLayout()
const t = useForgeT()

interface Role {
  id: number | string
  name: string
  permissions: string[]
}

const props = defineProps<{
  roles: Role[]
  catalog: string[]
  prefix: string
}>()

/** État local d'édition d'un rôle (nom + permissions, avant enregistrement). */
interface RoleState {
  name: string
  /** Le rôle a la permission joker `"*"` (toutes les permissions). */
  all: boolean
  /** Permissions cochées (hors `"*"`). */
  perms: Set<string>
}

// Map d'état keyed par role.id — recréée quand les props changent (retour
// serveur après save/create/delete) : re-init simple, pas de merge.
const states = ref<Record<string, RoleState>>({})

function init() {
  const next: Record<string, RoleState> = {}
  for (const r of props.roles) {
    next[String(r.id)] = {
      name: r.name,
      all: r.permissions.includes("*"),
      perms: new Set(r.permissions.filter((p) => p !== "*")),
    }
  }
  states.value = next
}
watch(() => props.roles, init, { immediate: true })

/** Rôles appariés à leur état local (l'état peut manquer un tick après re-init). */
const entries = computed(() =>
  props.roles
    .map((role) => ({ role, s: states.value[String(role.id)] }))
    .filter((e): e is { role: Role; s: RoleState } => Boolean(e.s))
)

// ————— Grille dynamique : groupe le catalog par domaine —————
// Domaine = tout ce qui précède le DERNIER point ("customers.kyc.write" →
// domaine "customers.kyc", action "write"). Sans point : la permission est
// son propre domaine.
const groups = computed(() => {
  const map = new Map<string, { action: string; perm: string }[]>()
  for (const p of props.catalog) {
    const i = p.lastIndexOf(".")
    const domain = i === -1 ? p : p.slice(0, i)
    const action = i === -1 ? p : p.slice(i + 1)
    if (!map.has(domain)) map.set(domain, [])
    map.get(domain)!.push({ action, perm: p })
  }
  return [...map.entries()]
})

const catalogSet = computed(() => new Set(props.catalog))

/** Permissions du rôle absentes du catalog (feature supprimée, etc.). */
function orphans(s: RoleState): string[] {
  return [...s.perms].filter((p) => !catalogSet.value.has(p)).sort()
}

function togglePerm(s: RoleState, perm: string, on: boolean | "indeterminate") {
  if (on === true) s.perms.add(perm)
  else s.perms.delete(perm)
}

// ————— Actions serveur —————
const newName = ref("")

function create() {
  const name = newName.value.trim()
  if (!name) return
  router.post(`${props.prefix}/system/roles`, { name })
  newName.value = ""
}

function save(role: Role, s: RoleState) {
  router.post(`${props.prefix}/system/roles/${role.id}`, {
    name: s.name,
    // `"*"` seul si « toutes les permissions », sinon la sélection triée.
    permissions: s.all ? ["*"] : [...s.perms].sort(),
  })
}

async function remove(role: Role) {
  if (await confirmAction(t("roles.deleteConfirm"))) {
    router.post(`${props.prefix}/system/roles/${role.id}/delete`)
  }
}
</script>

<template>
  <component :is="Layout">
    <ConfirmDialog />
    <div class="mb-6">
      <h1 class="text-2xl">{{ t("roles.title") }}</h1>
      <p class="text-sm text-muted-foreground">{{ t("roles.description") }}</p>
    </div>

    <!-- Création d'un rôle -->
    <div class="mb-6 flex w-full max-w-md items-center gap-2">
      <Input v-model="newName" :placeholder="t('roles.placeholder')" @keyup.enter="create" />
      <Button :disabled="!newName.trim()" @click="create">
        <PhPlus :size="16" /> {{ t("roles.create") }}
      </Button>
    </div>

    <div class="space-y-4">
      <Card v-for="{ role, s } in entries" :key="role.id">
        <CardContent>
          <!-- Nom + actions -->
          <div class="flex flex-wrap items-center gap-2">
            <Input v-model="s.name" class="max-w-xs" />
            <div class="ml-auto flex items-center gap-1.5">
              <Button variant="default" size="sm" @click="save(role, s)">{{ t("roles.save") }}</Button>
              <Button
                variant="ghost"
                size="icon-sm"
                class="text-destructive"
                :aria-label="t('actions.delete')"
                @click="remove(role)"
              >
                <PhTrash :size="16" />
              </Button>
            </div>
          </div>

          <!-- Joker « toutes les permissions » : masque la grille quand actif -->
          <div class="mt-4 flex items-center gap-2.5">
            <Switch :id="`role-${role.id}-all`" v-model="s.all" size="sm" />
            <Label :for="`role-${role.id}-all`">{{ t("roles.allPerms") }}</Label>
          </div>

          <!-- Grille des permissions, groupées par domaine -->
          <div v-if="!s.all" class="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="[domain, actions] in groups" :key="domain" class="space-y-1.5">
              <p class="text-xs uppercase text-muted-foreground">{{ domain }}</p>
              <div class="space-y-1.5">
                <div v-for="a in actions" :key="a.perm" class="flex items-center gap-2">
                  <Checkbox
                    :id="`role-${role.id}-${a.perm}`"
                    :model-value="s.perms.has(a.perm)"
                    @update:model-value="(v) => togglePerm(s, a.perm, v)"
                  />
                  <Label :for="`role-${role.id}-${a.perm}`" class="font-normal">{{ a.action }}</Label>
                </div>
              </div>
            </div>
          </div>

          <!-- Permissions orphelines (absentes du catalog) : clic pour retirer -->
          <div v-if="!s.all && orphans(s).length" class="mt-5 space-y-1.5">
            <p class="text-xs uppercase text-muted-foreground">{{ t("roles.unknown") }}</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="p in orphans(s)"
                :key="p"
                type="button"
                class="cursor-pointer"
                @click="s.perms.delete(p)"
              >
                <Badge tone="warning">{{ p }} ✕</Badge>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </component>
</template>
