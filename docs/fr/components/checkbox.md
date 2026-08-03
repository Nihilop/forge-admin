# Checkbox

Case à cocher à `v-model` (booléen).

```vue
<script setup lang="ts">
import { ref } from "vue"
import { Checkbox } from "@/primitives/checkbox"
import { Label } from "@/primitives/label"

const accepted = ref(false)
</script>

<template>
  <div class="flex items-center gap-2">
    <Checkbox id="cgu" v-model="accepted" />
    <Label for="cgu">J'accepte les conditions</Label>
  </div>
</template>
```

Props utiles : `disabled`, et l'état indéterminé via
`:model-value="'indeterminate'"`. Pour cocher des lignes de table (sélection
bulk), placez la checkbox dans la première cellule avec `@click.stop`.
