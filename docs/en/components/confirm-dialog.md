# ConfirmDialog / confirmAction

The kit's **ready-made** confirmation: a promise-returning function, a single
shared dialog (AlertDialog), i18n. It's what guards the CRUD's deletions and
`confirm` actions.

```vue
<script setup lang="ts">
import ConfirmDialog from "@/components/ConfirmDialog.vue"
import { confirmAction } from "@/confirm"

async function archive() {
  if (await confirmAction("Archive this project?")) {
    // … the user confirmed
  }
}
</script>

<template>
  <!-- Mount the dialog ONCE in the page (or your custom layout) -->
  <ConfirmDialog />
  <Button variant="outline" @click="archive">Archive</Button>
</template>
```

## API

| Export | Role |
|---|---|
| `confirmAction(message)` | Opens the dialog; resolves `true` (Confirm) or `false` (Cancel / Escape). |
| `<ConfirmDialog />` | The dialog — one mount per page tree is enough. |

- The kit's CRUD pages already mount it: on a **custom** page, add
  `<ConfirmDialog />` yourself.
- Buttons and closing handled by the kit (robust against reka's internal
  handlers — see [AlertDialog](alert-dialog)).
- Labels (`Cancel`/`Confirm`) come from the kit's i18n, overridable
  (`forge.confirm.*`).
