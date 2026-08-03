<script setup lang="ts">
// Dialog d'ÉLÉVATION (extension OTP) — demande un code TOTP pour confirmer une
// action sensible. Monté une fois via l'outlet `overlays` du shell (otpUi()),
// piloté par elevation.ts (ensureElevated).
import { ref, watch } from "vue"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@forge/primitives/alert-dialog"
import { Button } from "@forge/primitives/button"
import { Input } from "@forge/primitives/input"
import { Label } from "@forge/primitives/label"
import { useForgeT } from "@forge/i18n"
import { useElevationDialog } from "./elevation"

const t = useForgeT()
const { open, pending, error, submit, cancel } = useElevationDialog()

const code = ref("")
watch(open, (v) => {
  if (v) code.value = ""
})

function onDismiss(v: boolean) {
  if (!v) setTimeout(() => cancel(), 0)
}
</script>

<template>
  <AlertDialog :open="open" @update:open="onDismiss">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t("otp.elevateTitle") }}</AlertDialogTitle>
      </AlertDialogHeader>
      <form class="space-y-3" @submit.prevent="submit(code)">
        <p class="text-sm text-muted-foreground">{{ t("otp.elevateHint") }}</p>
        <p
          v-if="error"
          class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {{ t("otp.invalid") }}
        </p>
        <div class="space-y-1.5">
          <Label for="elevate-code">{{ t("otp.codeLabel") }}</Label>
          <Input
            id="elevate-code"
            v-model="code"
            inputmode="numeric"
            autocomplete="one-time-code"
            placeholder="123 456"
            autofocus
            required
          />
        </div>
      </form>
      <AlertDialogFooter>
        <Button variant="outline" @click="cancel">{{ t("confirm.cancel") }}</Button>
        <Button :disabled="pending" @click="submit(code)">{{ t("otp.verify") }}</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
