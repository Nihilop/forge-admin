# Tooltip

Infobulle au survol — indispensable sur les boutons icône.

```vue
<script setup lang="ts">
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/primitives/tooltip"
import { Button } from "@/primitives/button"
import { PhArrowsClockwise } from "@phosphor-icons/vue"
</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button size="icon-sm" variant="ghost" aria-label="Rafraîchir">
          <PhArrowsClockwise :size="16" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Rafraîchir les données</TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
```

- `TooltipProvider` englobe une zone (souvent une page) — un seul suffit,
  il porte le `delay-duration`.
- `TooltipTrigger as-child` pour tooltiper votre propre élément.
- `TooltipContent` accepte `side` (`top`/`right`/`bottom`/`left`) et `align`.
- La sidebar du shell tooltipe déjà ses entrées en mode replié (`tooltip` de
  `SidebarMenuButton`).
