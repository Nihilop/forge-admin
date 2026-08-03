# Sonner (toasts)

Ephemeral notifications via [vue-sonner](https://vue-sonner.vercel.app).

**1. Mount the `Toaster` once** (in your entry, after the layout):

```ts
// src/main.ts — or in your custom layout
import { Toaster } from "@/primitives/sonner"
```

```vue
<Toaster position="top-right" rich-colors />
```

**2. Emit toasts from anywhere:**

```ts
import { toast } from "vue-sonner"

toast.success("Product published")
toast.error("Could not save")
toast("Export started", { description: "You'll receive an email." })
```

::: info Not mounted by default (yet)
The shell doesn't mount the `Toaster` (yet) — do it in your app if you use
toasts. Wiring server *flash messages* → toasts is planned with the auth
module (roadmap).
:::
