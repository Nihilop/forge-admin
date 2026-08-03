# Switch

Interrupteur à `v-model` — pour les réglages on/off (préférez la
[Checkbox](checkbox) pour les consentements/sélections).

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

Props : `disabled`. Émet `update:model-value` à chaque bascule — pratique pour
un enregistrement immédiat (`@update:model-value="save"`).
