# AlertDialog

Modale **bloquante** (pas de fermeture par clic extérieur) pour les décisions
importantes.

::: tip Pour confirmer une action, utilisez `confirmAction`
Le kit fournit déjà une confirmation prête à l'emploi construite sur
AlertDialog — voir [ConfirmDialog / confirmAction](confirm-dialog). N'utilisez
AlertDialog en direct que pour un contenu de décision **custom**.
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
        <AlertDialogTitle>Transférer la propriété ?</AlertDialogTitle>
        <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <Button variant="outline" @click="open = false">Annuler</Button>
        <Button variant="destructive" @click="transfer()">Transférer</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
```

::: warning Boutons du footer
Préférez les `Button` du kit à `AlertDialogAction`/`AlertDialogCancel` : les
handlers **internes** de ces derniers ferment la boîte avant vos `@click` —
votre logique de confirmation peut ne jamais s'exécuter (c'est pour ça que
`ConfirmDialog` du kit est construit ainsi).
:::
