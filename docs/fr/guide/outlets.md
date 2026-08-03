# Outlets

Un **outlet** est un point d'ancrage nommé du layout dans lequel des composants
s'enregistrent **au boot** — c'est le mécanisme qui permet aux
[extensions](frontend#les-extensions-ui) (et à votre app) d'injecter de l'UI
dans le shell **sans le modifier** : menu utilisateur, badge 2FA, indicateur
d'environnement, notifications…

## Outlets fournis par le shell

| Outlet | Emplacement |
|---|---|
| `header:start` | Topbar, à droite du trigger sidebar (après le [slot par page](#slots-par-page-vs-outlets)). |
| `header:end` | Topbar, à droite (avant les toggles langue/thème). |
| `sidebar:footer` | Pied de la sidebar. |

## Enregistrer un composant

Deux voies, toujours **avant `app.mount()`** :

```ts
// 1. Via une extension (recommandé — groupé avec le reste de la feature) :
installForgeExtensions(app, [
  { name: "env-indicator", outlets: { "header:end": EnvBadge } },
], { i18n })

// 2. Directement :
import { registerShellItem } from "@/shell/registry"
registerShellItem("sidebar:footer", UserMenu)
```

Plusieurs composants peuvent viser le même outlet : ils sont rendus dans
l'**ordre d'enregistrement**.

## Créer vos propres outlets

`ForgeOutlet` est un composant public — placez-le où vous voulez, avec le nom
que vous voulez. C'est utile dans un **layout custom** (pour rester compatible
avec les extensions) comme dans le shell par défaut si vous l'étendez :

```vue
<script setup lang="ts">
import ForgeOutlet from "@/shell/ForgeOutlet.vue"
</script>

<template>
  <footer>
    <ForgeOutlet name="footer:legal" />
  </footer>
</template>
```

::: tip Convention de nommage
`zone:position` (`header:end`, `sidebar:footer`, `footer:legal`…). Les noms
sont libres, mais une extension communautaire ciblera les outlets **standard**
du tableau ci-dessus — si votre layout custom les expose, ces extensions
fonctionneront chez vous sans adaptation.
:::

## Slots par page vs outlets

Deux mécanismes complémentaires — ne les confondez pas :

| | Slot (`#header-start`) | Outlet (`header:start`) |
|---|---|---|
| Portée | **Par page** — passé par la page qui rend le layout | **Globale** — enregistré une fois au boot |
| Usage type | Lien retour, titre contextuel | Menu user, 2FA, notifications |
| Accès aux props de la page | Oui (c'est son template) | Non (composant autonome) |
| Nommage | kebab (`header-start` — `:` est réservé par `v-slot`) | `zone:position` |

Le shell rend le slot **avant** l'outlet de la même zone. Voir
[Pages custom](pages) pour l'usage des slots.
