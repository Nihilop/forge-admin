# Input

`v-model` text field — the input behind CRUD forms and search.

```vue
<script setup lang="ts">
import { ref } from "vue"
import { Input } from "@forge/primitives/input"
import { Label } from "@forge/primitives/label"

const email = ref("")
</script>

<template>
  <div class="space-y-1.5 max-w-lg">
    <Label for="email">Email</Label>
    <Input id="email" v-model="email" type="email" placeholder="you@example.com" />
  </div>
</template>
```

- `v-model` + every native attribute (`type`, `placeholder`, `disabled`,
  `required`…) pass through as-is.
- Search-with-icon pattern (used by the CRUD list): `relative` wrapper,
  `absolute` icon, `class="pl-9"` on the input.
