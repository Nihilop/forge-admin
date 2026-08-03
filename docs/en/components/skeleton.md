# Skeleton

Loading placeholder (pulse) — size it with classes.

```vue
<script setup lang="ts">
import { Skeleton } from "@forge/primitives/skeleton"
</script>

<template>
  <div class="space-y-2">
    <Skeleton class="h-8 w-48" />
    <Skeleton class="h-4 w-full" />
    <Skeleton class="h-4 w-2/3" />
  </div>
</template>
```

Useful during deferred loading (dashboard widgets, async content). The CRUD
doesn't need it: pages arrive rendered (SSR).
