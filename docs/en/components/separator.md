# Separator

Horizontal or vertical divider.

```vue
<script setup lang="ts">
import { Separator } from "@/primitives/separator"
</script>

<template>
  <p>Section A</p>
  <Separator class="my-4" />
  <p>Section B</p>

  <!-- Vertical (e.g. the shell's topbar) -->
  <div class="flex h-8 items-center gap-2">
    <span>Left</span>
    <Separator orientation="vertical" class="data-[orientation=vertical]:h-4" />
    <span>Right</span>
  </div>
</template>
```

| Prop | Values | Default |
|---|---|---|
| `orientation` | `horizontal` · `vertical` | `horizontal` |

When vertical, give it a height (`data-[orientation=vertical]:h-4`).
