# Card

Le conteneur de base des pages — fiches du CRUD, stat tiles du dashboard.

```vue
<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@forge/primitives/card"
</script>

<template>
  <!-- Forme courte (celle du CRUD) -->
  <Card>
    <CardContent>
      <p class="text-xs text-muted-foreground">Commandes</p>
      <p class="mt-1 text-3xl font-semibold tabular-nums">128</p>
    </CardContent>
  </Card>

  <!-- Forme complète -->
  <Card>
    <CardHeader>
      <CardTitle>Revenus</CardTitle>
      <CardDescription>30 derniers jours</CardDescription>
    </CardHeader>
    <CardContent>…</CardContent>
    <CardFooter>…</CardFooter>
  </Card>
</template>
```

Sous-composants : `Card` · `CardHeader` · `CardTitle` · `CardDescription` ·
`CardAction` · `CardContent` · `CardFooter`. Tout est slot — aucune prop
obligatoire.
