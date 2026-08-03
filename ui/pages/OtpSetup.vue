<script setup lang="ts">
// Page « Sécurité (2FA) » (extension OTP) — chaque admin gère SA double
// authentification : générer un secret, l'enrôler dans une app TOTP
// (Google Authenticator, Aegis…), confirmer un code, ou désactiver.
import { Link, useForm } from "@inertiajs/vue3"
import { Badge } from "@forge/primitives/badge"
import { Button } from "@forge/primitives/button"
import { Card, CardContent } from "@forge/primitives/card"
import { Input } from "@forge/primitives/input"
import { Label } from "@forge/primitives/label"
import { useForgeLayout } from "@forge/layout"
import { useForgeT } from "@forge/i18n"

const Layout = useForgeLayout()
const t = useForgeT()

const props = defineProps<{
  enabled: boolean
  pendingSecret?: string
  uri?: string
  error?: boolean
  prefix: string
}>()

const generate = useForm({})
const confirm = useForm<Record<string, string>>({ code: "" })
const disable = useForm<Record<string, string>>({ code: "" })
</script>

<template>
  <component :is="Layout">
    <div class="mb-4 flex items-center gap-3">
      <h1 class="text-2xl">{{ t("otp.title") }}</h1>
      <Badge :tone="enabled ? 'success' : 'muted'">
        {{ enabled ? t("otp.stateEnabled") : t("otp.stateDisabled") }}
      </Badge>
    </div>

    <Card class="max-w-2xl">
      <CardContent class="space-y-4">
        <p
          v-if="error"
          class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {{ t("otp.invalid") }}
        </p>

        <!-- 2FA active : désactivation (code exigé) -->
        <template v-if="enabled">
          <p class="text-sm text-muted-foreground">{{ t("otp.enabledHint") }}</p>
          <form
            class="flex max-w-sm items-end gap-2"
            @submit.prevent="disable.post(`${props.prefix}/system/otp/disable`)"
          >
            <div class="flex-1 space-y-1.5">
              <Label for="otp-disable">{{ t("otp.codeLabel") }}</Label>
              <Input
                id="otp-disable"
                v-model="disable.code"
                inputmode="numeric"
                autocomplete="one-time-code"
                required
              />
            </div>
            <Button type="submit" variant="destructive" :disabled="disable.processing">
              {{ t("otp.disable") }}
            </Button>
          </form>
        </template>

        <!-- Secret généré : enrollment + confirmation -->
        <template v-else-if="pendingSecret">
          <p class="text-sm text-muted-foreground">{{ t("otp.enrollHint") }}</p>
          <div class="space-y-1.5">
            <Label>{{ t("otp.uriLabel") }}</Label>
            <pre class="overflow-x-auto rounded-md border bg-muted/40 px-3 py-2 text-xs"><code>{{ uri }}</code></pre>
          </div>
          <div class="space-y-1.5">
            <Label>{{ t("otp.secretLabel") }}</Label>
            <code class="block rounded-md border bg-muted/40 px-3 py-2 text-sm tracking-wider">
              {{ pendingSecret }}
            </code>
          </div>
          <form
            class="flex max-w-sm items-end gap-2"
            @submit.prevent="confirm.post(`${props.prefix}/system/otp/enable`)"
          >
            <div class="flex-1 space-y-1.5">
              <Label for="otp-confirm">{{ t("otp.codeLabel") }}</Label>
              <Input
                id="otp-confirm"
                v-model="confirm.code"
                inputmode="numeric"
                autocomplete="one-time-code"
                placeholder="123 456"
                required
              />
            </div>
            <Button type="submit" :disabled="confirm.processing">{{ t("otp.enable") }}</Button>
          </form>
        </template>

        <!-- Rien : proposer la génération -->
        <template v-else>
          <p class="text-sm text-muted-foreground">{{ t("otp.setupIntro") }}</p>
          <form @submit.prevent="generate.post(`${props.prefix}/system/otp/generate`)">
            <Button type="submit" :disabled="generate.processing">{{ t("otp.generate") }}</Button>
          </form>
        </template>
      </CardContent>
    </Card>
  </component>
</template>
