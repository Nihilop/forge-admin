# Label

Libellé de champ accessible (associé par `for`/`id`).

```vue
<script setup lang="ts">
import { Label } from "@/primitives/label"
import { Input } from "@/primitives/input"
</script>

<template>
  <div class="space-y-1.5">
    <Label for="name">Nom <span class="text-destructive">*</span></Label>
    <Input id="name" required />
  </div>
</template>
```

C'est le pattern des formulaires CRUD (`space-y-1.5`, astérisque destructive
pour le requis, mention `(réservé)` en `text-xs text-muted-foreground` pour un
champ verrouillé).
