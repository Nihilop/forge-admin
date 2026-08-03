# Button

The kit's button — the one behind every CRUD action.

```vue
<script setup lang="ts">
import { Button } from "@forge/primitives/button"
import { PhPlus } from "@phosphor-icons/vue"
</script>

<template>
  <Button>Save</Button>
  <Button variant="outline">Cancel</Button>
  <Button variant="destructive">Delete</Button>
  <Button size="icon-sm" aria-label="Add"><PhPlus :size="16" /></Button>
</template>
```

## API

| Prop | Values | Default |
|---|---|---|
| `variant` | `default` · `outline` · `secondary` · `ghost` · `destructive` · `link` | `default` |
| `size` | `default` · `xs` · `sm` · `lg` · `icon` · `icon-sm` | `default` |
| `as-child` | Renders the child instead of the `<button>` (keeps the styling). | — |

::: tip `as-child` + Inertia Link
For a button that navigates, don't use `@click="router.visit(...)"` — compose
with the real link:

```vue
<Button as-child variant="outline">
  <Link :href="`${prefix}/products/create`">New</Link>
</Button>
```
:::

`size="icon-sm"` (32px) is a kit extension — used across the shell and CRUD
pages for compact icon buttons.
