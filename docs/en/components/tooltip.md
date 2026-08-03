# Tooltip

Hover tooltip — essential on icon buttons.

```vue
<script setup lang="ts">
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@forge/primitives/tooltip"
import { Button } from "@forge/primitives/button"
import { PhArrowsClockwise } from "@phosphor-icons/vue"
</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button size="icon-sm" variant="ghost" aria-label="Refresh">
          <PhArrowsClockwise :size="16" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Refresh data</TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
```

- `TooltipProvider` wraps an area (often a page) — one is enough, it carries
  the `delay-duration`.
- `TooltipTrigger as-child` to tooltip your own element.
- `TooltipContent` accepts `side` (`top`/`right`/`bottom`/`left`) and `align`.
- The shell's sidebar already tooltips its entries in collapsed mode
  (`SidebarMenuButton`'s `tooltip`).
