# Textarea

Multi-line `v-model` text area.

```vue
<script setup lang="ts">
import { ref } from "vue"
import { Textarea } from "@/primitives/textarea"

const notes = ref("")
</script>

<template>
  <Textarea v-model="notes" placeholder="Internal notes…" rows="4" />
</template>
```

Native attributes (`rows`, `placeholder`, `disabled`…) pass through. For a
multi-line resource field, prefer the kit's named input:
`text("notes", { input: "textarea", editable: true })` — see
[Fields](../guide/fields).
