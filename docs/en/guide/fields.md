# Fields

A field describes **one column**: how to display it (list + detail) and how to
edit it (form). You create them with typed helpers.

## The helpers

| Helper | Usage |
|---|---|
| `text(key, opts?)` | Short text (labels, references…). |
| `email(key, opts?)` | Email — validated in the form. |
| `select(key, opts?)` | Dropdown (`options`). |
| `badge(key, opts?)` | Colored enum (`options` + `tone`) — filterable in the list. |
| `date(key, opts?)` | Timestamp — the frontend formats it (send an epoch in ms). |
| `belongsTo(key, { … })` | Foreign key to another resource. |

By default a field is **visible in the list** and **not editable** — you opt in
explicitly to what can be modified.

## Common options

| Option | Role |
|---|---|
| `label` | Label. Default: the humanized key. |
| `column` | **Display expression** (code-defined, never user input). Default: the key. |
| `writeColumn` | **Write** column when it differs from the display one. |
| `list` | Visible in the list. Default: `true` (`false` = detail only). |
| `wide` | Detail + form: full width (long content). |
| `searchable` | Included in full-text search. |
| `editable` | Editable in the form. Default: `false`. |
| `required` | Required on input (validated server-side). |
| `options` | `[{ value, label, tone? }]` for `select` / `badge`. Submitted values are **validated against the options** server-side. |
| `permission` | Permission required to **edit** this field — see [Permissions](permissions). |
| `display` / `input` | Registered custom component — see [Frontend kit](frontend). |

## Examples

**Badge with tones** (`tone`: `success` · `warning` · `danger` · `primary` ·
`muted`). Any field with options automatically becomes a **faceted filter** on
the list:

```ts
badge("status", {
  label: "Status",
  editable: true,
  options: [
    { value: "draft", label: "Draft", tone: "muted" },
    { value: "active", label: "Active", tone: "success" },
  ],
})
```

**Date through an expression** — the engine sends an epoch in ms, the frontend
formats it per locale:

```ts
date("created_at", {
  label: "Created",
  column: "(EXTRACT(EPOCH FROM created_at) * 1000)::float8",
})
```

**Computed column** (display subquery):

```ts
badge("kyc", {
  label: "KYC",
  column: `(SELECT status FROM kyc_verifications
            WHERE person_id = persons.id
            ORDER BY created_at DESC LIMIT 1)`,
  options: [/* … */],
})
```

::: warning `column` is code, not data
The `column` / `writeColumn` / `orderBy` expressions are written by **you** in
code and interpreted by the [adapter](engine) (SQL for Postgres). Never inject
user input into them — the *values* always go through bound parameters.
:::

**Write ≠ display** — display a formatted string, write the raw column:

```ts
text("price", {
  label: "Price",
  editable: true,
  column: "price::text",   // display
  writeColumn: "price",    // write
})
```

**`belongsTo` relation**:

```ts
belongsTo("product", {
  resource: "products",   // the target resource (declared)
  column: "product_id",   // the FK in THIS table
  labelField: "name",     // displayed field of the target
  label: "Product",
  editable: true,         // → dropdown of targets in the form
})
```

What you get: in lists and detail pages, a **clickable link** to the target
(`{ id, label }` resolved by the engine); in the form, a select fed with the
target records (soft-deleted ones excluded); sorting on the column sorts by the
target's **label**.

**Full-width field** (bio, description, markdown…):

```ts
text("body", { label: "Content", wide: true, editable: true, list: false })
```

**Permission-gated field** — locked in the form **and** rejected server-side:

```ts
text("legal_name", { label: "Legal name", editable: true, permission: "customers.kyc.write" })
```

## Custom display / input

When a helper is not enough, reference a component **registered** on the
frontend — the rest of the field (column, permission, list…) keeps working:

```ts
text("body", { display: "markdown", input: "markdown", wide: true, editable: true })
```

Registration (`registerDisplay` / `registerInput`) is covered in
[Frontend kit](frontend). The kit already ships `markdown` (editor + renderer).
