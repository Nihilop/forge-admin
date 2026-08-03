# Badge

The kit's **semantic-tone** badge — exactly the rendering of the CRUD's
`badge` fields, so your custom statuses look identical to its own.

```vue
<script setup lang="ts">
import { Badge } from "@forge/primitives/badge"
</script>

<template>
  <Badge tone="success">Active</Badge>
  <Badge tone="warning">Pending</Badge>
  <Badge tone="danger">Error</Badge>
  <Badge tone="primary">New</Badge>
  <Badge>Draft</Badge> <!-- muted (default) -->
</template>
```

## API

| Prop | Values | Default |
|---|---|---|
| `tone` | `success` · `warning` · `danger` · `primary` · `muted` | `muted` |

This is a **kit** component (not shadcn's variant badge): same tones as the
`tone` option of [badge fields](../guide/fields). Per-tone classes are exported
if needed (`badgeToneClasses`).
