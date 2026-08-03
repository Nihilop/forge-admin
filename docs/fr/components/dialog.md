# Dialog

Boîte modale généraliste (formulaires, détails, assistants). Pour une
**confirmation**, préférez [`confirmAction`](confirm-dialog).

```vue
<script setup lang="ts">
import { ref } from "vue"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/primitives/dialog"
import { Button } from "@/primitives/button"

const open = ref(false)
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button variant="outline">Inviter un membre</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Inviter un membre</DialogTitle>
        <DialogDescription>Un email d'invitation sera envoyé.</DialogDescription>
      </DialogHeader>
      <!-- votre formulaire -->
      <DialogFooter>
        <Button variant="outline" @click="open = false">Annuler</Button>
        <Button @click="submit">Inviter</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

- `v-model:open` pour le contrôle programmatique (ou laissez `DialogTrigger`
  gérer).
- Ferme sur Échap et clic extérieur (contrairement à
  [AlertDialog](alert-dialog)).
- `DialogClose as-child` pour un bouton de fermeture custom.
