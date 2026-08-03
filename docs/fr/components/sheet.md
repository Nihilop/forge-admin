# Sheet

Panneau latéral coulissant (off-canvas) — détails rapides, filtres avancés,
formulaires contextuels.

```vue
<script setup lang="ts">
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/primitives/sheet"
import { Button } from "@/primitives/button"
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button variant="outline">Filtres avancés</Button>
    </SheetTrigger>
    <SheetContent side="right">
      <SheetHeader>
        <SheetTitle>Filtres</SheetTitle>
        <SheetDescription>Affinez la liste.</SheetDescription>
      </SheetHeader>
      <!-- votre contenu -->
    </SheetContent>
  </Sheet>
</template>
```

- `side` : `right` (défaut) · `left` · `top` · `bottom`.
- `v-model:open` pour le contrôle programmatique ; `SheetClose`/`SheetFooter`
  disponibles.
- C'est le composant qu'utilise la sidebar du shell en mode mobile.
