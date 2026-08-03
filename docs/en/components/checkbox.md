# Checkbox

`v-model` checkbox (boolean).

```vue
<script setup lang="ts">
import { ref } from "vue"
import { Checkbox } from "@/primitives/checkbox"
import { Label } from "@/primitives/label"

const accepted = ref(false)
</script>

<template>
  <div class="flex items-center gap-2">
    <Checkbox id="terms" v-model="accepted" />
    <Label for="terms">I accept the terms</Label>
  </div>
</template>
```

Useful props: `disabled`, and the indeterminate state via
`:model-value="'indeterminate'"`. For checking table rows (bulk selection),
place the checkbox in the first cell with `@click.stop`.
