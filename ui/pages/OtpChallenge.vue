<script setup lang="ts">
// Étape 2FA du login (extension OTP) — rendue par le serveur quand l'admin a
// la 2FA activée : mot de passe validé, code TOTP exigé avant la session.
// STANDALONE comme Login (pas de shell : pas encore de session).
import { useForm } from "@inertiajs/vue3"
import { Button } from "@forge/primitives/button"
import { Card, CardContent } from "@forge/primitives/card"
import { Input } from "@forge/primitives/input"
import { Label } from "@forge/primitives/label"
import { useForgeT } from "@forge/i18n"
const t = useForgeT()

defineProps<{ error?: boolean }>()

const form = useForm<Record<string, string>>({ code: "" })

function submit() {
  form.post("/login/otp")
}
</script>

<template>
  <div class="flex min-h-svh items-center justify-center bg-background p-4">
    <Card class="w-full max-w-sm">
      <CardContent>
        <div class="mb-6 text-center">
          <h1 class="font-heading text-xl">{{ t("otp.challengeTitle") }}</h1>
          <p class="mt-1 text-sm text-muted-foreground">{{ t("otp.challengeHint") }}</p>
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <p
            v-if="error"
            class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {{ t("otp.invalid") }}
          </p>
          <div class="space-y-1.5">
            <Label for="otp-code">{{ t("otp.codeLabel") }}</Label>
            <Input
              id="otp-code"
              v-model="form.code"
              inputmode="numeric"
              autocomplete="one-time-code"
              placeholder="123 456"
              autofocus
              required
            />
          </div>
          <Button type="submit" class="w-full" :disabled="form.processing">
            {{ t("otp.verify") }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
