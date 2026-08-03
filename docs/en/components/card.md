# Card

The base container for pages — CRUD detail views, dashboard stat tiles.

```vue
<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/primitives/card"
</script>

<template>
  <!-- Short form (the CRUD's) -->
  <Card>
    <CardContent>
      <p class="text-xs text-muted-foreground">Orders</p>
      <p class="mt-1 text-3xl font-semibold tabular-nums">128</p>
    </CardContent>
  </Card>

  <!-- Full form -->
  <Card>
    <CardHeader>
      <CardTitle>Revenue</CardTitle>
      <CardDescription>Last 30 days</CardDescription>
    </CardHeader>
    <CardContent>…</CardContent>
    <CardFooter>…</CardFooter>
  </Card>
</template>
```

Sub-components: `Card` · `CardHeader` · `CardTitle` · `CardDescription` ·
`CardAction` · `CardContent` · `CardFooter`. Everything is slots — no required
props.
