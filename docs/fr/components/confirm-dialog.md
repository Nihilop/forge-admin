# ConfirmDialog / confirmAction

La confirmation **prête à l'emploi** du kit : une fonction qui retourne une
promesse, une seule boîte partagée (AlertDialog), i18n. C'est elle qui protège
les suppressions et les actions à `confirm` du CRUD.

```vue
<script setup lang="ts">
import ConfirmDialog from "@/components/ConfirmDialog.vue"
import { confirmAction } from "@/confirm"

async function archive() {
  if (await confirmAction("Archiver ce projet ?")) {
    // … l'utilisateur a confirmé
  }
}
</script>

<template>
  <!-- Montez la boîte UNE fois dans la page (ou votre layout custom) -->
  <ConfirmDialog />
  <Button variant="outline" @click="archive">Archiver</Button>
</template>
```

## API

| Export | Rôle |
|---|---|
| `confirmAction(message)` | Ouvre la boîte, résout `true` (Confirmer) ou `false` (Annuler / Échap). |
| `<ConfirmDialog />` | La boîte — un seul montage nécessaire par arbre de pages. |

- Les pages CRUD du kit la montent déjà : sur une page **custom**, ajoutez
  `<ConfirmDialog />` vous-même.
- Boutons et fermeture gérés par le kit (pattern robuste face aux handlers
  internes de reka — voir [AlertDialog](alert-dialog)).
- Libellés (`Annuler`/`Confirmer`) via l'i18n du kit, surchargeables
  (`forge.confirm.*`).
