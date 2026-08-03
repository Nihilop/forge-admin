# Input

Champ texte à `v-model` — l'input des formulaires CRUD et de la recherche.

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
    <Input id="email" v-model="email" type="email" placeholder="vous@exemple.com" />
  </div>
</template>
```

- `v-model` + tous les attributs natifs (`type`, `placeholder`, `disabled`,
  `required`…) passent tels quels.
- Pattern recherche avec icône (utilisé par la liste CRUD) : wrapper `relative`,
  icône en `absolute`, `class="pl-9"` sur l'input.
