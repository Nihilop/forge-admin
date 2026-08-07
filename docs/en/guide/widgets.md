# Dashboard widgets

Declare **widgets** and Forge composes your home page: as soon as at least one
widget exists, the admin root (`GET <prefix>`) renders a **dashboard** instead
of redirecting to the first menu entry. It is also the post-login landing
page.

```ts
import { defineWidget } from "@streemkit/forge/engine"

defineWidget({
  key: "products-active",
  title: "Active products",
  type: "stat",
  order: 1,
  data: async () => {
    const [s] = await query(`SELECT COUNT(*)::int AS n FROM products WHERE status = 'active'`)
    return { value: s.n, hint: "in the catalog" }
  },
})
```

The `data` resolver is written by **you** (it closes over your data layer —
pool, ORM, fetch…) and runs on the server **on every request**.

## The two types

### `stat` — key figure

`data` returns `{ value, hint? }`:

```ts
defineWidget({
  key: "revenue",
  title: "Revenue",
  type: "stat",
  data: async () => ({ value: "$12,430", hint: "+8% this month" }),
})
```

### `list` — rows

`data` returns `{ items: [{ label, value?, href? }] }` — a row with `href`
becomes a **link** (Inertia navigation):

```ts
defineWidget({
  key: "latest-orders",
  title: "Latest orders",
  type: "list",
  data: async () => ({
    items: (await lastOrders()).map((o) => ({
      label: o.customer,
      value: `×${o.qty}`,
      href: `/admin/orders/${o.id}`,
    })),
  }),
})
```

## The options (`WidgetDef`)

| Option | Role |
|---|---|
| `key` | Unique id. |
| `title` | Card title. |
| `type` | `stat` or `list`. |
| `order` | Display order (ascending). |
| `span` | Width in grid columns (1 to 4). Default: `1` (`2` for `list`). |
| `permission` | Permission required to **see** the widget — feeds the roles page's [dynamic catalog](permissions). |
| `data` | Data resolver, per request. |

## Robustness

- A resolver that **throws** doesn't take the dashboard down: its card shows
  an error state, the others keep living.
- Permission-gated widgets disappear for operators who lack it — server-side
  (never sent).

::: tip Menu
The dashboard doesn't add a menu entry on its own — point one at it with
[`definePage`](pages): `definePage({ name: "dash", href: "/admin", label:
"Dashboard", nav: { … }, exact: true })`.
:::
