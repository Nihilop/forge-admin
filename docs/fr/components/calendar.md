# Calendar

Calendrier de sélection de date (reka-ui + `@internationalized/date`). C'est
la brique du **date picker** des champs `datetime` du CRUD — réutilisable dans
vos pages custom.

```vue
<script setup lang="ts">
import { ref } from "vue"
import type { DateValue } from "@internationalized/date"
import { Calendar } from "@forge/primitives/calendar"

const date = ref<DateValue>()
</script>

<template>
  <Calendar v-model="date" />
</template>
```

La valeur est un `DateValue` (`CalendarDate`) de `@internationalized/date` —
convertissez vers/depuis vos `Date` JS :

```ts
import { CalendarDate } from "@internationalized/date"

const cal = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
const js = new Date(cal.year, cal.month - 1, cal.day)
```

Pour un **picker** complet (bouton + popover + heure), composez avec
[Popover](popover) — c'est exactement ce que fait l'input `datetime` du kit.
