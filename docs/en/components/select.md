# Select

Dropdown list — the one behind faceted filters and `select`/`badge` fields.

```vue
<script setup lang="ts">
import { ref } from "vue"
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "@forge/primitives/select"

const status = ref("all")
</script>

<template>
  <Select v-model="status">
    <SelectTrigger class="w-40">
      <SelectValue placeholder="Status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All</SelectItem>
      <SelectItem value="active">Active</SelectItem>
      <SelectItem value="draft">Draft</SelectItem>
    </SelectContent>
  </Select>
</template>
```

- `v-model` on the root (`Select`), values carried by the items' `value`.
- Event-driven variant (like the CRUD filters):
  `:model-value="x" @update:model-value="onChange"`.
- `SelectGroup` + `SelectLabel` for grouping; `disabled` on an item.
