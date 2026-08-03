// Forge base messages — English. `FORGE_I18N_NS.*` namespace. Host may override keys.

import { FORGE_I18N_NS } from "../brand"

export default {
  [FORGE_I18N_NS]: {
    actions: {
      new: "New",
      edit: "Edit",
      delete: "Delete",
      create: "Create",
      save: "Save",
      more: "More",
      label: "Actions",
      view: "View",
    },
    index: {
      search: "Search…",
      columns: "Columns",
      filterAll: "all",
      count: "{n} item(s)",
      empty: "No items.",
      range: "{from}–{to} of {total}",
      rangeEmpty: "0 items",
      perPage: "{n} / page",
      prev: "Previous",
      next: "Next",
    },
    form: {
      titleCreate: "New — {label}",
      titleEdit: "Edit — {label} #{id}",
      back: "Back",
      linkedTo: "Linked to {label}",
      locked: "(restricted)",
    },
    show: {
      empty: "None.",
    },
    confirm: {
      delete: "Delete this item?",
      cancel: "Cancel",
      confirm: "Confirm",
    },
    auth: {
      subtitle: "Sign in to continue",
      email: "Email",
      password: "Password",
      submit: "Sign in",
    },
    roles: {
      title: "Roles & permissions",
      description:
        "Permissions derive from your resources, fields, actions and pages — this page adapts automatically.",
      placeholder: "Role name…",
      create: "Create",
      save: "Save",
      deleteConfirm: "Delete this role?",
      allPerms: "All permissions",
      unknown: "Unknown permissions",
    },
  },
}
