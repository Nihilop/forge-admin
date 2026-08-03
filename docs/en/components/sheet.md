# Sheet

Sliding side panel (off-canvas) — quick details, advanced filters, contextual
forms.

```vue
<script setup lang="ts">
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@forge/primitives/sheet"
import { Button } from "@forge/primitives/button"
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button variant="outline">Advanced filters</Button>
    </SheetTrigger>
    <SheetContent side="right">
      <SheetHeader>
        <SheetTitle>Filters</SheetTitle>
        <SheetDescription>Refine the list.</SheetDescription>
      </SheetHeader>
      <!-- your content -->
    </SheetContent>
  </Sheet>
</template>
```

- `side`: `right` (default) · `left` · `top` · `bottom`.
- `v-model:open` for programmatic control; `SheetClose`/`SheetFooter`
  available.
- This is the component the shell's sidebar uses in mobile mode.
