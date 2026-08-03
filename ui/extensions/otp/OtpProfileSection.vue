<script setup lang="ts">
// Section « 2FA » injectée dans la page PROFIL via l'outlet `profile:sections`
// (otpUi()). Affiche l'état d'enrollment (lu sur /system/otp/state) et renvoie
// vers la page de gestion 2FA de la moitié serveur (/system/otp).
import { onMounted, ref } from "vue"
import { Link, usePage } from "@inertiajs/vue3"
import { Badge } from "@forge/primitives/badge"
import { Button } from "@forge/primitives/button"
import { Card, CardContent } from "@forge/primitives/card"
import { useForgeT } from "@forge/i18n"

const t = useForgeT()
const prefix = String((usePage().props as Record<string, unknown>).prefix ?? "/admin")

const enabled = ref<boolean | null>(null) // null = chargement
onMounted(async () => {
  try {
    const res = await fetch(`${prefix}/system/otp/state`, { credentials: "include" })
    if (res.ok) enabled.value = (await res.json()).enabled === true
  } catch {
    // état inconnu : la carte reste utilisable via le lien « Gérer »
  }
})
</script>

<template>
  <Card>
    <CardContent class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-base font-medium">{{ t("otp.title") }}</h2>
        <Badge v-if="enabled !== null" :tone="enabled ? 'success' : 'muted'">
          {{ enabled ? t("otp.stateEnabled") : t("otp.stateDisabled") }}
        </Badge>
      </div>
      <p class="text-sm text-muted-foreground">{{ t("otp.setupIntro") }}</p>
      <Button as-child variant="outline" size="sm">
        <Link :href="`${prefix}/system/otp`">{{ t("profile.manage") }}</Link>
      </Button>
    </CardContent>
  </Card>
</template>
