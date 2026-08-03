# Badge

Le badge à **tones sémantiques** du kit — exactement le rendu des champs
`badge` du CRUD, pour que vos statuts custom soient identiques aux siens.

```vue
<script setup lang="ts">
import { Badge } from "@/primitives/badge"
</script>

<template>
  <Badge tone="success">Actif</Badge>
  <Badge tone="warning">En attente</Badge>
  <Badge tone="danger">Erreur</Badge>
  <Badge tone="primary">Nouveau</Badge>
  <Badge>Brouillon</Badge> <!-- muted (défaut) -->
</template>
```

## API

| Prop | Valeurs | Défaut |
|---|---|---|
| `tone` | `success` · `warning` · `danger` · `primary` · `muted` | `muted` |

C'est un composant **du kit** (pas le badge à variants de shadcn) : mêmes tones
que l'option `tone` des [champs badge](../guide/fields). Les classes par tone
sont exportées si besoin (`badgeToneClasses`).
