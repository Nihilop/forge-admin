<script setup lang="ts">
import { computed } from "vue"
import { Link } from "@inertiajs/vue3"
import { PhArrowLeft } from "@phosphor-icons/vue"
import { Button } from "@/primitives/button"
import { Label } from "@/primitives/label"
import { Card, CardContent } from "@/primitives/card"
import { useForgeLayout } from "@/layout"
const Layout = useForgeLayout()
import { inputFor } from "@/inputs"
import { useResourceForm } from "@/composables/useResourceForm"
import type { PublicField } from "@/fields"
import { useForgePrefix } from "@/prefix"
import { useForgeT } from "@/i18n"
const t = useForgeT()
const prefix = useForgePrefix()

interface ResourceMeta {
  name: string
  label: string
  fields: PublicField[]
}

interface Scope {
  via: string
  parent: string
  label: string
  parentLabel: string
  backHref: string
}

const props = defineProps<{
  resource: ResourceMeta
  row: Record<string, unknown>
  mode: "create" | "edit"
  scope?: Scope | null
}>()

const { form, submit } = useResourceForm(
  props.resource.name, props.resource.fields, props.row, props.mode,
  props.scope ? { via: props.scope.via, parent: props.scope.parent } : null,
)

const backHref = computed(() =>
  props.scope ? props.scope.backHref
  : props.mode === "create" ? `${prefix}/${props.resource.name}` : `${prefix}/${props.resource.name}/${props.row.id}`,
)
const title = computed(() =>
  props.mode === "create"
    ? t("form.titleCreate", { label: props.resource.label })
    : t("form.titleEdit", { label: props.resource.label, id: props.row.id }),
)
</script>

<template>
  <component :is="Layout">
    <!-- Contenu de header PAR PAGE : rendu dans le slot `header-start` du shell
         (avant l'outlet d'extensions). Un layout custom d'hôte qui veut ce lien
         doit exposer le même slot `header-start`. -->
    <template #header-start>
      <Link :href="backHref" class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <PhArrowLeft :size="15" /> {{ t("form.back") }}
      </Link>
    </template>

    <Card>
      <CardContent>
        <h1 class="text-2xl" :class="scope ? 'mb-1' : 'mb-6'">{{ title }}</h1>
        <p v-if="scope" class="mb-6 text-sm text-muted-foreground">
          {{ t("form.linkedTo", { label: scope.parentLabel }) }} · <span class="text-foreground">{{ scope.label }}</span>
        </p>
        <form class="space-y-4" @submit.prevent="submit">
          <p v-if="form.errors._form" class="max-w-lg rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {{ form.errors._form }}
          </p>
          <!-- Champs `wide` (ex. éditeur markdown) prennent plus de large ; les
               autres restent en colonne étroite. L'ordre déclaré est conservé. -->
          <div v-for="f in resource.fields" :key="f.key" class="space-y-1.5" :class="f.wide ? 'max-w-4xl' : 'max-w-lg'">
            <Label>
              {{ f.label }}<span v-if="f.required" class="text-destructive"> *</span>
              <span v-if="f.locked" class="ml-1 text-xs font-normal text-muted-foreground">{{ t("form.locked") }}</span>
            </Label>
            <component :is="inputFor(f)" v-model="form[f.key]" :field="f" />
            <p v-if="form.errors[f.key]" class="text-xs text-destructive">{{ form.errors[f.key] }}</p>
          </div>
          <div class="pt-2">
            <Button type="submit" :disabled="form.processing">{{ mode === "create" ? t("actions.create") : t("actions.save") }}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </component>
</template>
