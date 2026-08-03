# OverflowRow

Responsive "**priority+**" row: items that fit stay visible, overflowing ones
move into a "…" menu. The kit uses it for detail-page header buttons and
`hasMany` tabs.

```vue
<script setup lang="ts">
import OverflowRow from "@forge/OverflowRow.vue"
import { Button } from "@forge/primitives/button"
import { DropdownMenuItem } from "@forge/primitives/dropdown-menu"

const actions = [
  { key: "export", label: "Export", run: () => {} },
  { key: "sync", label: "Synchronize", run: () => {} },
  // … as many as you want: overflow is handled
]
</script>

<template>
  <OverflowRow :items="actions" :gap="8" align="end">
    <template #item="{ item }">
      <Button variant="outline" size="sm" class="shrink-0" @click="item.run()">
        {{ item.label }}
      </Button>
    </template>
    <template #menu-item="{ item }">
      <DropdownMenuItem @click="item.run()">{{ item.label }}</DropdownMenuItem>
    </template>
  </OverflowRow>
</template>
```

## API

| Prop / slot | Role |
|---|---|
| `items` | The items array (generic — any object). |
| `gap` | Gap in px — **must mirror** your `gap-*` class. Default: 8. |
| `align` | `start` · `end` (alignment of visible items). |
| `#item` | Inline rendering of an item (`{ item, index }`). |
| `#menu-item` | Rendering of the same item inside the overflow dropdown. |

Measurement uses an invisible "ghost" that renders every item — recomputed on
resize and font load.
