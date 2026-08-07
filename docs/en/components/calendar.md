# Calendar

Date selection calendar (reka-ui + `@internationalized/date`). It is the
building block of the CRUD's `datetime` **date picker** — reusable in your
custom pages.

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

The value is a `DateValue` (`CalendarDate`) from `@internationalized/date` —
convert to/from JS `Date`:

```ts
import { CalendarDate } from "@internationalized/date"

const cal = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
const js = new Date(cal.year, cal.month - 1, cal.day)
```

For a full **picker** (button + popover + time), compose with
[Popover](popover) — exactly what the kit's `datetime` input does.
