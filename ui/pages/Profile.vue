<script setup lang="ts">
// Page PROFIL — le compte de l'admin connecté : identité, mot de passe, et
// l'outlet `profile:sections` où les EXTENSIONS ajoutent leurs sections
// (ex. la 2FA de l'extension OTP). Rendue par le module auth.
import { useForm } from "@inertiajs/vue3"
import { Badge } from "@forge/primitives/badge"
import { Button } from "@forge/primitives/button"
import { Card, CardContent } from "@forge/primitives/card"
import { Input } from "@forge/primitives/input"
import { Label } from "@forge/primitives/label"
import { useForgeLayout } from "@forge/layout"
import { useForgeT } from "@forge/i18n"
import ForgeOutlet from "@forge/shell/ForgeOutlet.vue"

const Layout = useForgeLayout()
const t = useForgeT()

const props = defineProps<{
  admin: { email: string; name: string | null; role: string | null }
  prefix: string
}>()

const identity = useForm<Record<string, string>>({ name: props.admin.name ?? "" })
const password = useForm<Record<string, string>>({ current: "", next: "" })

function savePassword() {
  password.post(`${props.prefix}/system/profile/password`, {
    onSuccess: () => password.reset(),
  })
}
</script>

<template>
  <component :is="Layout">
    <div class="mb-4 flex items-center gap-3">
      <h1 class="text-2xl">{{ t("profile.title") }}</h1>
      <Badge v-if="admin.role" tone="primary">{{ admin.role }}</Badge>
    </div>

    <div class="grid max-w-4xl gap-4 lg:grid-cols-2">
      <!-- Identité -->
      <Card>
        <CardContent class="space-y-4">
          <h2 class="text-base font-medium">{{ t("profile.identity") }}</h2>
          <div class="space-y-1.5">
            <Label>{{ t("auth.email") }}</Label>
            <Input :model-value="admin.email" disabled />
          </div>
          <form
            class="space-y-4"
            @submit.prevent="identity.post(`${props.prefix}/system/profile`)"
          >
            <div class="space-y-1.5">
              <Label for="profile-name">{{ t("profile.name") }}</Label>
              <Input id="profile-name" v-model="identity.name" />
            </div>
            <Button type="submit" size="sm" :disabled="identity.processing">
              {{ t("actions.save") }}
            </Button>
          </form>
        </CardContent>
      </Card>

      <!-- Mot de passe -->
      <Card>
        <CardContent class="space-y-4">
          <h2 class="text-base font-medium">{{ t("profile.password") }}</h2>
          <form class="space-y-4" @submit.prevent="savePassword">
            <div class="space-y-1.5">
              <Label for="pwd-current">{{ t("profile.currentPassword") }}</Label>
              <Input
                id="pwd-current"
                v-model="password.current"
                type="password"
                autocomplete="current-password"
                required
              />
              <p v-if="password.errors.current" class="text-xs text-destructive">
                {{ password.errors.current }}
              </p>
            </div>
            <div class="space-y-1.5">
              <Label for="pwd-next">{{ t("profile.newPassword") }}</Label>
              <Input
                id="pwd-next"
                v-model="password.next"
                type="password"
                autocomplete="new-password"
                required
              />
              <p v-if="password.errors.next" class="text-xs text-destructive">
                {{ password.errors.next }}
              </p>
            </div>
            <Button type="submit" size="sm" :disabled="password.processing">
              {{ t("profile.changePassword") }}
            </Button>
          </form>
        </CardContent>
      </Card>

      <!-- Sections des EXTENSIONS (2FA de l'extension OTP, etc.) -->
      <ForgeOutlet name="profile:sections" />
    </div>
  </component>
</template>
