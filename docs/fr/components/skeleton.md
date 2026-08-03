# Skeleton

Placeholder de chargement (pulse) — dimensionnez-le avec des classes.

```vue
<script setup lang="ts">
import { Skeleton } from "@/primitives/skeleton"
</script>

<template>
  <div class="space-y-2">
    <Skeleton class="h-8 w-48" />
    <Skeleton class="h-4 w-full" />
    <Skeleton class="h-4 w-2/3" />
  </div>
</template>
```

Utile pendant les chargements différés (widgets de dashboard, contenus
asynchrones). Le CRUD n'en a pas besoin : les pages arrivent rendues (SSR).
