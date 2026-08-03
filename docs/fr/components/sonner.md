# Sonner (toasts)

Notifications éphémères via [vue-sonner](https://vue-sonner.vercel.app).

**1. Montez le `Toaster` une fois** (dans votre entrée, après le layout) :

```ts
// src/main.ts — ou dans votre layout custom
import { Toaster } from "@/primitives/sonner"
```

```vue
<Toaster position="top-right" rich-colors />
```

**2. Émettez des toasts depuis n'importe où :**

```ts
import { toast } from "vue-sonner"

toast.success("Produit publié")
toast.error("Enregistrement impossible")
toast("Export lancé", { description: "Vous recevrez un email." })
```

::: info Pas encore monté par défaut
Le shell ne monte pas (encore) le `Toaster` — à faire dans votre app si vous
utilisez les toasts. Le branchement des *flash messages* serveur → toasts est
prévu avec le module auth (roadmap).
:::
