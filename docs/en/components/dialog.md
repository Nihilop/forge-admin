# Dialog

General-purpose modal (forms, details, wizards). For a **confirmation**,
prefer [`confirmAction`](confirm-dialog).

```vue
<script setup lang="ts">
import { ref } from "vue"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@forge/primitives/dialog"
import { Button } from "@forge/primitives/button"

const open = ref(false)
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button variant="outline">Invite a member</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Invite a member</DialogTitle>
        <DialogDescription>An invitation email will be sent.</DialogDescription>
      </DialogHeader>
      <!-- your form -->
      <DialogFooter>
        <Button variant="outline" @click="open = false">Cancel</Button>
        <Button @click="submit">Invite</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

- `v-model:open` for programmatic control (or let `DialogTrigger` handle it).
- Closes on Escape and outside click (unlike [AlertDialog](alert-dialog)).
- `DialogClose as-child` for a custom close button.
