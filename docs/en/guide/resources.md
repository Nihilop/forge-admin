# Resources

A **resource** describes a model (a table); Forge generates its entire CRUD.
Declare it with `defineResource` — importing the file registers it
(side-effect), there is no separate registration step.

```ts
import { defineResource, text } from "forge/engine"

export default defineResource({
  name: "products",
  table: "products",
  label: "Products",
  policy: "catalog",
  fields: [text("name", { editable: true, required: true })],
})
```

::: warning The table must exist
Forge **never** creates business tables: `table` references a table managed by
**your** migrations. The engine reads and writes into it, nothing more.
:::

## All options

| Option | Type | Role |
|---|---|---|
| `name` | `string` | URL slug (`<prefix>/:name`). |
| `table` | `string` | SQL table (or collection, depending on the [adapter](engine)). |
| `label` | `string` | Display label. |
| `policy` | `string` | **Required.** RBAC base: `${policy}.read` / `.write`. A resource without a policy throws at registration. |
| `search` | `string[]` | Searchable keys (full-text, ILIKE on Postgres). |
| `orderBy` | `string` | Default ordering (storage expression, code-defined). Default: `"id" DESC`. |
| `create` / `delete` | `boolean` | Enable create / delete. Default: `true`. |
| `softDelete` | `string` | Soft-delete column — DELETE becomes `UPDATE … = now()` and deleted rows are hidden everywhere. |
| `nav` | `{ group, label?, icon?, order? }` | Presence + position in the sidebar. Without `nav`, the resource exists but is not in the menu. |
| `hasMany` | `HasManyDef[]` | Child relations shown on the detail page. |
| `tabs` | `boolean` | `hasMany` sections as tabs (otherwise stacked). |
| `actions` | `ActionDef[]` | Custom buttons on the **detail** page. |
| `listActions` | `ActionDef[]` | Custom buttons on the **list** (import, export…). |
| `hooks` | see below | Post-mutation business logic. |
| `fields` | `Field[]` | The fields — see [Fields](fields). |

## `hasMany` relations

Shows children on the parent's detail page, with optional scoped creation:

```ts
defineResource({
  name: "products",
  // …
  hasMany: [
    {
      key: "orders",             // section id
      label: "Orders",
      resource: "orders",        // ANOTHER declared resource
      foreignKey: "product_id",  // the FK on the child
      columns: ["customer", "qty", "status"],  // child field keys to show
      create: true,              // "New" button → pre-filled FK
    },
  ],
  tabs: true,                    // sections as tabs
})
```

What the engine does:

- The section only appears if the operator holds the **child** resource's
  `read` permission (RBAC all the way down).
- `create: true` adds a "New" button opening the child form **scoped**: the FK
  is injected server-side (and only if the relation whitelists it — no way to
  forge an arbitrary column), the field disappears from the form, and a banner
  shows the parent.
- Rows are clickable through to the child's detail page.

## Custom actions

Buttons wired to **your** endpoints. Forge renders the button (permission +
conditional visibility) and performs the POST; the route is yours.

```ts
actions: [
  {
    key: "publish",
    label: "Publish",
    icon: "rocket",
    confirm: "Publish this product?",
    visibleWhen: { field: "status", equals: "draft" }, // depends on the row
    href: "/products/:id/publish",   // YOUR endpoint (`:id` is resolved)
    data: { source: "admin" },       // POST body (optional)
  },
]
```

```ts
// Your endpoint, on the same Hono:
admin.app.post("/products/:id/publish", async (c) => {
  const id = c.req.param("id")
  await query(`UPDATE products SET status = 'active' WHERE id = $1`, [id])
  return redirect(`${admin.prefix}/products/${id}`)
})
```

| Option | Role |
|---|---|
| `key` / `label` / `icon` | Button identity (`icon`: a name resolved on the frontend, see [Frontend kit](frontend)). |
| `href` | Target URL. `:id` replaced with the row id. |
| `link` | `true` → **navigates** (GET) instead of POSTing (e.g. open a custom form). |
| `confirm` | Confirmation prompt before firing. |
| `permission` | Required permission. Default: `${policy}.write`. |
| `visibleWhen` | `{ field, equals?, notEquals? }` — row-dependent visibility (detail page only). |
| `variant` | Button style (`default`, `outline`, `ghost`, `destructive`, `secondary`). |

`listActions`: same shape, shown on the **list**, without `:id` or
`visibleWhen`.

## Business hooks

Invoked **after** a successful mutation — the engine knows nothing about your
domain, it notifies:

```ts
hooks: {
  afterCreate: async ({ id }) => { await indexRecord(id) },
  afterUpdate: async ({ id, changed }) => {
    // `changed` = keys of the fields whose value changed
    if (changed.includes("status")) await notifyStatusChange(id)
  },
  afterDelete: async ({ id, row }) => {
    // `row` = the FULL row before deletion (undeclared columns included)
    await cleanupFiles(row)
  },
}
```

## Recipes

**Read-only resource** (history, logs…):

```ts
defineResource({
  name: "audit-logs",
  table: "audit_logs",
  label: "Audit",
  policy: "audit",
  create: false,
  delete: false,
  fields: [/* no `editable` fields */],
})
```

**Menu-less resource** — omit `nav`: it stays reachable by URL and usable as a
`hasMany` target, without cluttering the sidebar.

**Soft-delete**:

```ts
defineResource({ /* … */, softDelete: "deleted_at" })
```

The "Delete" button fills `deleted_at`; lists, detail pages, relation options
and `hasMany` sections automatically hide deleted rows.
