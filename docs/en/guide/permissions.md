# Permissions (RBAC)

The model is deliberately simple: a permission is a **string**, an operator has
a **list of effective permissions**, and Forge checks — it stores **nothing**.
Where roles come from and who manages them is your system's business (or the
upcoming built-in auth module).

## The model

| Level | Permission checked |
|---|---|
| Read a resource (list, detail) | `${policy}.read` |
| Write (create, update, delete) | `${policy}.write` |
| Edit a field with a `permission` | the field's permission |
| Fire a custom action | `action.permission` (default: `${policy}.write`) |
| See a menu entry | the entry's derived permission |
| See a `hasMany` section | the **child** resource's `read` |

Behaviors:

- `permissions()` returns `null` → **anonymous** → redirect to `/login` (the
  login page is yours to provide).
- Missing read permission → redirect to `/` (no bare 403).
- Field with a missing `permission` → shown **locked** in the form *and*
  **ignored on write** server-side, even if the client submits it. Edge case
  covered: if it is `required` on creation, the operator gets a clear error
  instead of a cryptic NOT NULL violation.
- Buttons (create/edit/delete, actions): hidden without the permission — and
  the mutation routes re-check anyway.

## Providing permissions

Through the [facade](facade), the `permissions` option accepts three forms:

```ts
// 1. A per-request resolver — THE production mode.
forge({
  db,
  permissions: async (c) => {
    const session = await readSession(c)          // your auth
    if (!session) return null                     // anonymous → /login
    return await permissionsForRole(session.role) // → ["catalog.read", …]
  },
})

// 2. A static list — internal tool, prototype.
forge({ db, permissions: ["catalog.read", "catalog.write"] })

// 3. "open" — DEV ONLY. Derives ALL permissions from the registry
//    (policies, fields, actions, pages) and says so loudly at boot.
forge({ db, permissions: "open" })
```

With the [bare engine](engine) it's the `permissions(c)` field of the
`ForgeContext` — same contract: `Promise<string[] | null>`.

## Per-field granularity

```ts
defineResource({
  name: "customers",
  policy: "customers",
  fields: [
    text("name", { editable: true }),                                  // customers.write is enough
    text("iban", { editable: true, permission: "customers.finance" }), // + dedicated permission
  ],
})
```

An operator holding `customers.write` but not `customers.finance` sees the IBAN
field **read-only** (marked "restricted") and the server ignores any submitted
value for it.

## CSRF guard

Mutations go through a same-origin guard **before** the permission check. The
facade ships a default (`Sec-Fetch-Site`, then `Origin` comparison); override
it via `context.sameOrigin`, or provide your own to the bare engine. Without a
guard, only your session cookie's `SameSite` protects you.

## Good practices

- **`policy` everywhere** — it is required, on purpose: a resource without a
  policy would be open to any authenticated operator.
- Name as `domain.action`: `catalog.read`, `customers.kyc.write`… Forge does no
  implicit hierarchy — `catalog.write` does **not** imply `catalog.read`; grant
  both.
- Never rely on frontend hiding: it is a convenience. Security is the
  server-side re-validation (it is systematic).
