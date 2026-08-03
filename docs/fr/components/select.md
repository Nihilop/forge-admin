# Select

Liste déroulante — celle des filtres facettés et des champs `select`/`badge`.

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
      <SelectValue placeholder="Statut" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Tous</SelectItem>
      <SelectItem value="active">Actif</SelectItem>
      <SelectItem value="draft">Brouillon</SelectItem>
    </SelectContent>
  </Select>
</template>
```

- `v-model` sur la racine (`Select`), valeurs portées par `value` des items.
- Variante événementielle (comme les filtres du CRUD) :
  `:model-value="x" @update:model-value="onChange"`.
- `SelectGroup` + `SelectLabel` pour grouper ; `disabled` sur un item.
