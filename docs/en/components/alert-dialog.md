# AlertDialog

**Blocking** modal (no outside-click dismissal) for important decisions.

::: tip To confirm an action, use `confirmAction`
The kit already ships a ready-made confirmation built on AlertDialog — see
[ConfirmDialog / confirmAction](confirm-dialog). Use AlertDialog directly only
for **custom** decision content.
:::

```vue
<script setup lang="ts">
import { ref } from "vue"
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/primitives/alert-dialog"
import { Button } from "@/primitives/button"

const open = ref(false)
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Transfer ownership?</AlertDialogTitle>
        <AlertDialogDescription>This action is irreversible.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <Button variant="outline" @click="open = false">Cancel</Button>
        <Button variant="destructive" @click="transfer()">Transfer</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
```

::: warning Footer buttons
Prefer the kit's `Button` over `AlertDialogAction`/`AlertDialogCancel`: their
**internal** handlers close the dialog before your `@click` runs — your
confirmation logic may never execute (that's why the kit's `ConfirmDialog` is
built this way).
:::
