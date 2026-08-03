# DropdownMenu

Contextual menu — behind the CRUD's row actions and the language switcher.

```vue
<script setup lang="ts">
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@forge/primitives/dropdown-menu"
import { Button } from "@forge/primitives/button"
import { PhDotsThreeVertical } from "@phosphor-icons/vue"
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon-sm" aria-label="Actions">
        <PhDotsThreeVertical :size="18" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="edit()">Edit</DropdownMenuItem>
      <DropdownMenuCheckboxItem v-model="visible" @select.prevent>
        Column visible
      </DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="text-destructive" @click="remove()">Delete</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
```

- `align` (`start`/`end`) and `side` on the content.
- `@select.prevent` on an item keeps the menu **open** after click (the
  column-hiding pattern).
- Also available: `DropdownMenuGroup`, `DropdownMenuLabel`, submenus
  (`DropdownMenuSub*`), shortcuts (`DropdownMenuShortcut`).
