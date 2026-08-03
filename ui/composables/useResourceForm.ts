// Forge · kit Vue — logique d'un formulaire de resource (create ou edit).

import { useForm } from "@inertiajs/vue3"
import type { PublicField } from "./fields"
import { useForgePrefix } from "../prefix"

export interface FormScope {
  via: string
  parent: string
}

export function useResourceForm(
  resourceName: string,
  fields: PublicField[],
  row: Record<string, unknown>,
  mode: "create" | "edit",
  scope?: FormScope | null,
) {
  const prefix = useForgePrefix()
  const initial: Record<string, unknown> = {}
  for (const f of fields) {
    const v = row[f.key]
    // belongsTo : la valeur d'affichage est { id, label } → le form ne garde que l'id.
    initial[f.key] = f.type === "belongsTo" && v && typeof v === "object"
      ? (v as { id?: unknown }).id ?? ""
      : v ?? ""
  }

  const form = useForm(initial)

  function submit() {
    let url = mode === "create" ? `${prefix}/${resourceName}` : `${prefix}/${resourceName}/${row.id}`
    if (mode === "create" && scope) {
      url += `?via=${encodeURIComponent(scope.via)}&parent=${encodeURIComponent(scope.parent)}`
    }
    form.post(url, { preserveScroll: true })
  }

  return { form, submit }
}
