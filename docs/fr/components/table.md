# Table

La table de données — celle des listes CRUD et des sections `hasMany`.

```vue
<script setup lang="ts">
import {
  Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow,
} from "@/primitives/table"

const rows = [{ id: 1, name: "Clavier", status: "Actif" }]
</script>

<template>
  <div class="rounded-xl border bg-card/40">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableEmpty v-if="!rows.length" :colspan="2">Aucun élément.</TableEmpty>
        <TableRow v-for="r in rows" :key="r.id" class="cursor-pointer" @click="open(r)">
          <TableCell>{{ r.name }}</TableCell>
          <TableCell>{{ r.status }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
```

- Sous-composants : `Table` · `TableHeader` · `TableBody` · `TableRow` ·
  `TableHead` · `TableCell` · `TableEmpty` (ligne vide avec `colspan`) ·
  `TableCaption` · `TableFooter`.
- Le wrapper `rounded-xl border bg-card/40` est la convention visuelle des
  listes du kit.
- Pour l'état de liste complet (recherche/tri/pagination server-side), voyez le
  composable `useResourceTable` ([Kit frontend](../guide/frontend)).
