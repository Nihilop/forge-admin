# Table

The data table — behind CRUD lists and `hasMany` sections.

```vue
<script setup lang="ts">
import {
  Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow,
} from "@/primitives/table"

const rows = [{ id: 1, name: "Keyboard", status: "Active" }]
</script>

<template>
  <div class="rounded-xl border bg-card/40">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableEmpty v-if="!rows.length" :colspan="2">No items.</TableEmpty>
        <TableRow v-for="r in rows" :key="r.id" class="cursor-pointer" @click="open(r)">
          <TableCell>{{ r.name }}</TableCell>
          <TableCell>{{ r.status }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
```

- Sub-components: `Table` · `TableHeader` · `TableBody` · `TableRow` ·
  `TableHead` · `TableCell` · `TableEmpty` (empty row with `colspan`) ·
  `TableCaption` · `TableFooter`.
- The `rounded-xl border bg-card/40` wrapper is the kit's visual convention for
  lists.
- For full list state (server-side search/sort/pagination), see the
  `useResourceTable` composable ([Frontend kit](../guide/frontend)).
