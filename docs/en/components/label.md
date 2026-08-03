# Label

Accessible field label (associated via `for`/`id`).

```vue
<script setup lang="ts">
import { Label } from "@forge/primitives/label"
import { Input } from "@forge/primitives/input"
</script>

<template>
  <div class="space-y-1.5">
    <Label for="name">Name <span class="text-destructive">*</span></Label>
    <Input id="name" required />
  </div>
</template>
```

This is the CRUD forms' pattern (`space-y-1.5`, destructive asterisk for
required, `(restricted)` note in `text-xs text-muted-foreground` for a locked
field).
