# Button

Le bouton du kit — celui de toutes les actions du CRUD.

```vue
<script setup lang="ts">
import { Button } from "@forge/primitives/button"
import { PhPlus } from "@phosphor-icons/vue"
</script>

<template>
  <Button>Enregistrer</Button>
  <Button variant="outline">Annuler</Button>
  <Button variant="destructive">Supprimer</Button>
  <Button size="icon-sm" aria-label="Ajouter"><PhPlus :size="16" /></Button>
</template>
```

## API

| Prop | Valeurs | Défaut |
|---|---|---|
| `variant` | `default` · `outline` · `secondary` · `ghost` · `destructive` · `link` | `default` |
| `size` | `default` · `xs` · `sm` · `lg` · `icon` · `icon-sm` | `default` |
| `as-child` | Rend l'enfant à la place du `<button>` (garde le style). | — |

::: tip `as-child` + Link Inertia
Pour un bouton qui navigue, ne mettez pas de `@click="router.visit(...)"` —
composez avec le vrai lien :

```vue
<Button as-child variant="outline">
  <Link :href="`${prefix}/products/create`">Nouveau</Link>
</Button>
```
:::

`size="icon-sm"` (32px) est une extension du kit — utilisée partout dans le
shell et les pages CRUD pour les boutons d'icône compacts.
