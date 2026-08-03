# Breadcrumb

Breadcrumb trail — ideal in the shell's `header-start` slot.

```vue
<script setup lang="ts">
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/primitives/breadcrumb"
import { Link } from "@inertiajs/vue3"
</script>

<template>
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink as-child>
          <Link href="/admin/products">Products</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>Mechanical keyboard</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
</template>
```

- `BreadcrumbLink as-child` + Inertia `Link` for SPA navigation.
- `BreadcrumbPage` = the current item (not clickable).
- `BreadcrumbEllipsis` to truncate long paths.
