# Popover

Floating overlay anchored to a trigger — non-modal (unlike [Dialog](dialog)).
Used by the kit for the `datetime` fields' date picker.

```vue
<script setup lang="ts">
import { Button } from "@forge/primitives/button"
import { Popover, PopoverContent, PopoverTrigger } from "@forge/primitives/popover"
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline">Open</Button>
    </PopoverTrigger>
    <PopoverContent class="w-72">
      Content anchored to the button.
    </PopoverContent>
  </Popover>
</template>
```

Useful props on `PopoverContent`: `align` (`start` / `center` / `end`),
`side-offset`, and your own classes (`class="w-auto p-0"` for dense content
like a [Calendar](calendar)).
