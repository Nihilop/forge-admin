# Separator

Filet séparateur horizontal ou vertical.

```vue
<script setup lang="ts">
import { Separator } from "@forge/primitives/separator"
</script>

<template>
  <p>Section A</p>
  <Separator class="my-4" />
  <p>Section B</p>

  <!-- Vertical (ex. la topbar du shell) -->
  <div class="flex h-8 items-center gap-2">
    <span>Gauche</span>
    <Separator orientation="vertical" class="data-[orientation=vertical]:h-4" />
    <span>Droite</span>
  </div>
</template>
```

| Prop | Valeurs | Défaut |
|---|---|---|
| `orientation` | `horizontal` · `vertical` | `horizontal` |

En vertical, donnez-lui une hauteur (`data-[orientation=vertical]:h-4`).
