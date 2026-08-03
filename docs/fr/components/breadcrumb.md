# Breadcrumb

Fil d'ariane — idéal dans le slot `header-start` du shell.

```vue
<script setup lang="ts">
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage,
  BreadcrumbSeparator,
} from "@forge/primitives/breadcrumb"
import { Link } from "@inertiajs/vue3"
</script>

<template>
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink as-child>
          <Link href="/admin/products">Produits</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>Clavier mécanique</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
</template>
```

- `BreadcrumbLink as-child` + `Link` Inertia pour la navigation SPA.
- `BreadcrumbPage` = l'élément courant (non cliquable).
- `BreadcrumbEllipsis` pour tronquer les chemins longs.
