# DropdownMenu

Menu contextuel — celui des actions de ligne du CRUD et du sélecteur de langue.

```vue
<script setup lang="ts">
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/primitives/dropdown-menu"
import { Button } from "@/primitives/button"
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
      <DropdownMenuItem @click="edit()">Modifier</DropdownMenuItem>
      <DropdownMenuCheckboxItem v-model="visible" @select.prevent>
        Colonne visible
      </DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="text-destructive" @click="remove()">Supprimer</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
```

- `align` (`start`/`end`) et `side` sur le contenu.
- `@select.prevent` sur un item garde le menu **ouvert** après clic (pattern du
  masquage de colonnes).
- Existe aussi : `DropdownMenuGroup`, `DropdownMenuLabel`, sous-menus
  (`DropdownMenuSub*`), raccourcis (`DropdownMenuShortcut`).
