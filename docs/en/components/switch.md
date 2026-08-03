# Switch

`v-model` toggle — for on/off settings (prefer the [Checkbox](checkbox) for
consents/selections).

```vue
<script setup lang="ts">
import { ref } from "vue"
import { Switch } from "@/primitives/switch"
import { Label } from "@/primitives/label"

const notifications = ref(true)
</script>

<template>
  <div class="flex items-center gap-2">
    <Switch id="notif" v-model="notifications" />
    <Label for="notif">Notifications</Label>
  </div>
</template>
```

Props: `disabled`. Emits `update:model-value` on every toggle — handy for
immediate persistence (`@update:model-value="save"`).
