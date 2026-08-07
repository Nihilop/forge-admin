# Fields

A field describes **one column**: how to display it (list + detail) and how to
edit it (form). You create them with typed helpers.

## The helpers

| Helper | Usage |
|---|---|
| `text(key, opts?)` | Short text (labels, references…). |
| `textarea(key, opts?)` | Long text — textarea in the form (consider `wide: true`). |
| `email(key, opts?)` | Email — validated in the form. |
| `number(key, opts?)` | Number — coerced and validated server-side (`min` / `max` / `step`). |
| `boolean(key, opts?)` | Boolean — Switch in the form, Yes/No badge in lists. |
| `select(key, opts?)` | Dropdown (`options`). |
| `badge(key, opts?)` | Colored enum (`options` + `tone`) — filterable in the list. |
| `date(key, opts?)` | Date only — the frontend formats it (send an epoch in ms). |
| `datetime(key, opts?)` | Date + time — native input, written as ISO-8601 (UTC). |
| `json(key, opts?)` | JSON — monospace editor, parse-validated server-side, pretty display. |
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
| `min` / `max` / `step` | Bounds and step of a `number` field — `min`/`max` are validated in the form **and** server-side. |

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

**Bounded number** — the value is coerced (string → number, comma accepted)
and the bounds are re-validated server-side:

```ts
number("price", {
  label: "Price",
  editable: true,
  min: 0,
  step: 0.01,
  column: "price::float8", // NUMERIC arrives as a string: cast it for display
  writeColumn: "price",
})
```

**Boolean, date+time, JSON** — server-side coercion normalizes what the
browser sends (strings) before the adapter:

```ts
boolean("featured", { label: "Featured", editable: true }),
datetime("published_at", { label: "Published", editable: true, list: false }),
json("metadata", { label: "Metadata", editable: true, list: false, wide: true }),
```

- `boolean`: Switch in the form, **Yes/No** badge in lists and detail pages.
- `datetime`: `datetime-local` input (local time), written as **ISO-8601
  UTC** — a `TIMESTAMPTZ` column takes it as-is.
- `json`: the input is **parse-validated** ("Invalid JSON" otherwise) and
  written normalized — a `json`/`jsonb` column casts it natively. The display
  is pretty-printed (consider `wide: true`).

**Write ≠ display** — display an expression, write the raw column (`column` =
display, `writeColumn` = write, as on `price` above).

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
