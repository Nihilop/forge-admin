<script setup lang="ts">
// La boîte de confirmation du kit (AlertDialog) — pilotée par confirm.ts.
// Montée une fois par page (les pages CRUD le font) ; Échap = annuler.
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@forge/primitives/alert-dialog"
import { Button } from "@forge/primitives/button"
import { useForgeT } from "@forge/i18n"
import { useConfirmDialog } from "../confirm"

const t = useForgeT()
const { open, message, answer } = useConfirmDialog()

// Dismiss (Échap, fermeture interne de reka) : DIFFÉRÉ d'un tick. Le handler
// interne de reka ferme AVANT notre @click — sans ça, « Confirmer » serait
// résolu en `false` par la fermeture avant que answer(true) ne s'exécute.
function onDismiss(v: boolean) {
  if (!v) setTimeout(() => answer(false), 0)
}
</script>

<template>
  <AlertDialog :open="open" @update:open="onDismiss">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ message }}</AlertDialogTitle>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <!-- Boutons du KIT (pas AlertDialogAction/Cancel : leurs handlers
             internes reka ferment avant nos @click — la fermeture est à nous). -->
        <Button variant="outline" @click="answer(false)">{{ t("confirm.cancel") }}</Button>
        <Button @click="answer(true)">{{ t("confirm.confirm") }}</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
