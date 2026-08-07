# Popover

Surcouche flottante ancrée à un déclencheur — non modale (contrairement à
[Dialog](dialog)). Utilisée par le kit pour le date picker des champs
`datetime`.

```vue
<script setup lang="ts">
import { Button } from "@forge/primitives/button"
import { Popover, PopoverContent, PopoverTrigger } from "@forge/primitives/popover"
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline">Ouvrir</Button>
    </PopoverTrigger>
    <PopoverContent class="w-72">
      Contenu ancré au bouton.
    </PopoverContent>
  </Popover>
</template>
```

Props utiles sur `PopoverContent` : `align` (`start` / `center` / `end`),
`side-offset`, et vos classes (`class="w-auto p-0"` pour un contenu dense
comme un [Calendar](calendar)).
