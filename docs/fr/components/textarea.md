# Textarea

Zone de texte multi-lignes à `v-model`.

```vue
<script setup lang="ts">
import { ref } from "vue"
import { Textarea } from "@forge/primitives/textarea"

const notes = ref("")
</script>

<template>
  <Textarea v-model="notes" placeholder="Notes internes…" rows="4" />
</template>
```

Attributs natifs (`rows`, `placeholder`, `disabled`…) passés tels quels. Pour
un champ de resource multi-lignes, préférez l'input nommé du kit :
`text("notes", { input: "textarea", editable: true })` — voir
[Champs](../guide/fields).
