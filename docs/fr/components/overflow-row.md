# OverflowRow

Rangée responsive « **priority+** » : les éléments qui tiennent restent
visibles, ceux qui débordent passent dans un menu « … ». Le kit l'utilise pour
les boutons d'en-tête de fiche et les onglets `hasMany`.

```vue
<script setup lang="ts">
import OverflowRow from "@forge/OverflowRow.vue"
import { Button } from "@forge/primitives/button"
import { DropdownMenuItem } from "@forge/primitives/dropdown-menu"

const actions = [
  { key: "export", label: "Exporter", run: () => {} },
  { key: "sync", label: "Synchroniser", run: () => {} },
  // … autant que vous voulez : le débordement est géré
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

| Prop / slot | Rôle |
|---|---|
| `items` | Le tableau d'éléments (générique — n'importe quel objet). |
| `gap` | Écart en px — **doit refléter** votre classe `gap-*`. Défaut : 8. |
| `align` | `start` · `end` (alignement des visibles). |
| `#item` | Rendu inline d'un élément (`{ item, index }`). |
| `#menu-item` | Rendu du même élément dans le dropdown de débordement. |

La mesure est faite via un « ghost » invisible qui rend tous les éléments —
recalculée au resize et au chargement des polices.
