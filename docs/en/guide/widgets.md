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

## The three types

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

### `chart` — graph (area, bar, line)

`data` returns `{ categories, series }` — `categories` are the X-axis labels,
each series aligns one value per point. Multi-series: the legend shows up
automatically.

```ts
defineWidget({
  key: "orders-week",
  title: "Orders (7 days)",
  type: "chart",
  chart: "area", // "area" (default) | "bar" | "line"
  data: async () => ({
    categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    series: [
      { name: "Paid", values: [4, 6, 3, 8, 5, 9, 7] },
      { name: "Pending", values: [1, 2, 1, 3, 2, 1, 0] },
    ],
  }),
})
```

Charts build on shadcn-vue's chart components (Unovis) and follow the theme
(`--chart-1…5` tokens). The chart library is **loaded on demand**
(code-splitting): an admin without any `chart` widget never downloads Unovis.

## Resource metrics (`resource`)

A widget can be **scoped to a resource**: it then renders **above the table**
of its list page (`<prefix>/<resource>`) instead of the dashboard — Nova's
"metrics" pattern. Same API, same types, same permissions:

```ts
defineWidget({
  key: "products-stock",
  title: "Total stock",
  type: "stat",
  resource: "products", // ← rendered on /admin/products
  data: async () => {
    const [s] = await query(`SELECT COALESCE(SUM(stock), 0)::int AS n FROM products`)
    return { value: s.n }
  },
})
```

## The options (`WidgetDef`)

| Option | Role |
|---|---|
| `key` | Unique id. |
| `title` | Card title. |
| `type` | `stat`, `list` or `chart`. |
| `chart` | Variant of a `chart`: `area` (default), `bar`, `line`. |
| `order` | Display order (ascending). |
| `span` | Width in grid columns (1 to 4). Default: `1` (`2` for `list` and `chart`). |
| `permission` | Permission required to **see** the widget — feeds the roles page's [dynamic catalog](permissions). |
| `resource` | Scopes the widget to a **resource's index page** (model metric) instead of the dashboard. |
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
