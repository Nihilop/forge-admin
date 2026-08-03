<script setup lang="ts">
// Page de connexion STANDALONE — pas de shell/sidebar (l'utilisateur n'est pas
// encore authentifié) : un écran centré, autonome, rendu par le module d'auth.
import { computed } from "vue"
import { useForm } from "@inertiajs/vue3"
import { Button } from "@forge/primitives/button"
import { Card, CardContent } from "@forge/primitives/card"
import { Input } from "@forge/primitives/input"
import { Label } from "@forge/primitives/label"
import { useForgeT } from "@forge/i18n"
const t = useForgeT()

const props = defineProps<{ title?: string }>()

/** Titre affiché (et source de l'initiale de la pastille brand). */
const brand = computed(() => props.title ?? "Admin")
const initial = computed(() => brand.value.charAt(0).toUpperCase())

// Data typée en Record<string, string> pour que `errors._form` (erreur globale
// renvoyée par le serveur) reste indexable.
const form = useForm<Record<string, string>>({ email: "", password: "" })

function submit() {
  form.post("/login")
}
</script>

<template>
  <div class="flex min-h-svh items-center justify-center bg-background p-4">
    <Card class="w-full max-w-sm">
      <CardContent>
        <div class="mb-6 flex flex-col items-center gap-3 text-center">
          <!-- Pastille brand : carré arrondi avec l'initiale du titre -->
          <div class="grid size-10 place-items-center rounded-lg bg-primary font-heading text-lg text-primary-foreground">
            {{ initial }}
          </div>
          <div>
            <h1 class="font-heading text-xl">{{ brand }}</h1>
            <p class="text-sm text-muted-foreground">{{ t("auth.subtitle") }}</p>
          </div>
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <p v-if="form.errors._form" class="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {{ form.errors._form }}
          </p>
          <div class="space-y-1.5">
            <Label for="login-email">{{ t("auth.email") }}</Label>
            <Input id="login-email" v-model="form.email" type="email" autocomplete="email" required />
          </div>
          <div class="space-y-1.5">
            <Label for="login-password">{{ t("auth.password") }}</Label>
            <Input
              id="login-password"
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              required
            />
          </div>
          <Button type="submit" class="w-full" :disabled="form.processing">
            {{ t("auth.submit") }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
