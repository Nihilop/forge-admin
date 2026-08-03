<script setup lang="ts">
// Page CUSTOM de l'app — PAS générée par Forge. La route "/" est possédée par
// l'app (server.ts) ; `definePage` n'a ajouté que l'entrée de menu. La page
// compose le layout injecté + les primitives du kit, comme n'importe quelle
// page métier d'un hôte réel.
import { computed, ref } from "vue"
import { Link } from "@inertiajs/vue3"
import { PhArrowRight, PhLockKey } from "@phosphor-icons/vue"
import { Button } from "@forge/primitives/button"
import { Card, CardContent } from "@forge/primitives/card"
import { ensureElevated } from "@forge/extensions/otp"
import { useForgeLayout } from "@forge/layout"
import { useForgePrefix } from "@forge/prefix"

const Layout = useForgeLayout()
// Fourni par les props partagées de l'app (server.ts) — jamais codé en dur.
const prefix = useForgePrefix()

const props = defineProps<{
  stats: { products: number; active: number; orders: number; pending: number }
}>()

// Démo d'ÉLÉVATION (extension OTP) : l'action exige une session élevée —
// confirmation OTP si la 2FA est activée, accord direct sinon (mode souple).
const sensitiveResult = ref("")
async function fireSensitive() {
  sensitiveResult.value = ""
  if (!(await ensureElevated(prefix))) return
  const res = await fetch("/demo/sensitive", { method: "POST", credentials: "include" })
  sensitiveResult.value = res.ok ? "Action exécutée (session élevée) ✓" : `Refusé (${res.status})`
}

const tiles = computed(() => [
  { label: "Produits", value: props.stats.products, href: `${prefix}/products` },
  { label: "Produits actifs", value: props.stats.active, href: `${prefix}/products?f_status=active` },
  { label: "Commandes", value: props.stats.orders, href: `${prefix}/orders` },
  // Deep-link vers la liste FILTRÉE (filtres facettés server-side du CRUD).
  { label: "Commandes en attente", value: props.stats.pending, href: `${prefix}/orders?f_status=pending` },
])
</script>

<template>
  <component :is="Layout">
    <h1 class="text-2xl">Vue d'ensemble</h1>
    <p class="text-sm text-muted-foreground">
      Page custom de l'app — servie par sa propre route, à côté du CRUD Forge.
    </p>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card v-for="tile in tiles" :key="tile.label">
        <CardContent>
          <p class="text-xs text-muted-foreground">{{ tile.label }}</p>
          <p class="mt-1 text-3xl font-semibold tabular-nums">{{ tile.value }}</p>
          <Link
            :href="tile.href"
            class="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Voir la liste <PhArrowRight :size="12" />
          </Link>
        </CardContent>
      </Card>
    </div>

    <!-- Démo élévation (extension OTP) -->
    <Card class="mt-4 max-w-md">
      <CardContent class="space-y-2">
        <p class="text-xs text-muted-foreground">Démo extension OTP — action sensible</p>
        <Button variant="outline" size="sm" @click="fireSensitive">
          <PhLockKey :size="15" /> Exécuter l'action sensible
        </Button>
        <p v-if="sensitiveResult" class="text-xs text-muted-foreground">{{ sensitiveResult }}</p>
      </CardContent>
    </Card>
  </component>
</template>
