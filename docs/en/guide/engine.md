# Bare engine & adapters

Below the [facade](facade) sits an **agnostic** engine: `createForgeRouter`
depends only on Hono — data, auth, rendering and redirects are **injected**
through the `ForgeContext`. This chapter is for hosts that assemble things
themselves, and for writing an **adapter** to another store.

## The `ForgeContext`

```ts
import { createForgeRouter, postgresAdapter } from "forge/engine"

const router = createForgeRouter({
  adapter: postgresAdapter({ query: (sql, params) => db.query(sql, params) }),
  permissions: (c) => getPermissions(c),
  render: (c, page, props) => inertia.render(c, page, props),
  renderErrors: (c, page, props, errors) => inertia.renderWithErrors(c, page, props, errors),
  redirect: (to) => redirectResponse(to),
  sameOrigin: (c) => isSameOrigin(c),
  prefix: "/admin",
})

app.route("/admin", router)   // the SAME value as `prefix`
```

| Field | Role |
|---|---|
| `adapter` | Data layer (`ForgeAdapter` contract). Postgres ships built-in. |
| `query` | Sugar: a Postgres SQL executor, automatically wrapped in `postgresAdapter`. Ignored when `adapter` is provided. |
| `permissions(c)` | The operator's effective permissions (`null` = anonymous → `/login`). |
| `render(c, page, props)` | Renders a page. The engine names its pages `forge/ResourceIndex\|Show\|Form` and **injects `prefix` into the props**. |
| `renderErrors(…, errors)` | Renders with validation errors (field keys + `_form`). |
| `redirect(to)` | Redirect response (303 recommended for Inertia). |
| `sameOrigin(c)?` | CSRF guard for mutations (optional but recommended). |
| `prefix?` | Mount prefix. Default `/admin`. |

Since rendering is injected, the engine works **without the Vue kit**: serve
your own HTML, JSON, whatever — that's headless mode.

## The `ForgeAdapter` contract

The router speaks **no storage dialect**: it expresses intents, the adapter
translates them. Postgres is the reference implementation
(`postgresAdapter({ query })` — the *driver* stays yours: PGlite, postgres.js,
Neon…).

| Method | Intent |
|---|---|
| `count(def, where)` | Row count (pagination). `where` = `{ q?, filters? }`, already validated by the router. |
| `list(def, select)` | Projected, sorted, paginated rows. `select` adds `fields`, `sort?`, `limit`, `offset`. |
| `get(def, id)` | One row projected on all fields (`null` if missing or soft-deleted). |
| `getRaw(def, id)` | The **raw** row, no projection, no soft-delete filter (state for hooks). |
| `children(child, foreignKey, parentId, fields)` | Children of a `hasMany` relation. |
| `relationOptions(target, labelField)` | Options for an editable `belongsTo` (`{value,label}`, bounded, sorted). |
| `create(def, values)` | Inserts; returns the created id (`null` if unknown). `values` is keyed by **write column**. |
| `update(def, id, values)` | Updates (never called with empty `values`). |
| `delete(def, id)` | Deletes — **soft** when `def.softDelete` is set. |

Invariants to honor:

- **Values** (search, filters, form bodies) arrive already
  validated/whitelisted — but always pass them as bound parameters, never
  inside the query string.
- `belongsTo` projections return `{ id, label }` under the field's key.
- The defs' `column` / `writeColumn` / `orderBy` are expressions **of your
  store**: SQL for a SQL adapter, a document path for NoSQL. The adapter
  interprets them — a resource that uses none is portable as-is.

## Writing an adapter

Minimal skeleton (in-memory store, for the idea):

```ts
import type { ForgeAdapter, Row } from "forge/engine"

export function memoryAdapter(tables: Record<string, Row[]>): ForgeAdapter {
  const rows = (t: string) => tables[t] ?? []
  return {
    count: (def, w) => Promise.resolve(applyWhere(rows(def.table), def, w).length),
    list: (def, s) =>
      Promise.resolve(
        applyWhere(rows(def.table), def, s)
          .slice(s.offset, s.offset + s.limit)
          .map((r) => project(r, s.fields)),
      ),
    get: (def, id) => Promise.resolve(rows(def.table).find((r) => String(r.id) === id) ?? null),
    getRaw: (def, id) => Promise.resolve(rows(def.table).find((r) => String(r.id) === id) ?? null),
    children: (child, fk, parentId) =>
      Promise.resolve(rows(child.table).filter((r) => String(r[fk]) === parentId)),
    relationOptions: (target, labelField) =>
      Promise.resolve(rows(target.table).map((r) => ({
        value: String(r.id),
        label: String(r[labelField]),
      }))),
    create: (def, values) => {
      const id = String(rows(def.table).length + 1)
      rows(def.table).push({ id, ...values })
      return Promise.resolve(id)
    },
    update: (def, id, values) => {
      Object.assign(rows(def.table).find((r) => String(r.id) === id) ?? {}, values)
      return Promise.resolve()
    },
    delete: (def, id) => {
      const t = rows(def.table)
      t.splice(t.findIndex((r) => String(r.id) === id), 1)
      return Promise.resolve()
    },
  }
}
```

Plug it in with `forge({ db: memoryAdapter(seed) })` or
`createForgeRouter({ adapter })`. The Postgres adapter's tests
(`engine/adapters/postgres_test.ts`) show the expected behavior of every
method — the best spec for writing your own.
