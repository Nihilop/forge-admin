// Forge · moteur — routeur générique CRUD. AGNOSTIQUE : données (adapter), auth
// (permissions), rendu (render/renderErrors) et redirection sont INJECTÉS.
// Le routeur ne parle AUCUN dialecte de stockage : il exprime des intentions
// via le contrat ForgeAdapter (adapter.ts). Ne dépend que de Hono.

import { type Context, Hono } from "hono"
import { forgeNav, getResource, type ResourceDef } from "./resource.ts"
import { type Field, publicField } from "./field.ts"
import { forgePage } from "./brand.ts"
import { setForgePrefix } from "./prefix.ts"
import type { ForgeAdapter, ListWhere, Row } from "./adapter.ts"
import { postgresAdapter } from "./adapters/postgres.ts"

/** Everything the engine needs, injected by the host: data, auth, rendering,
 *  redirects. This is what keeps the engine agnostic — it has no opinion about
 *  your database, session system or view layer. */
export interface ForgeContext {
  /** Adapter de données (contrat adapter.ts). Postgres fourni :
   *  `adapter: postgresAdapter({ query })`. Alternative : `query` (sucre). */
  adapter?: ForgeAdapter
  /** Sucre Postgres : un exécuteur SQL `(sql, params) → rows` (PGlite,
   *  postgres.js, Neon…) — enveloppé automatiquement dans `postgresAdapter`.
   *  Ignoré si `adapter` est fourni. */
  query?: (sql: string, params?: unknown[]) => Promise<Row[]>
  /** Permissions effectives de l'opérateur courant (`null` = anonyme → /login). */
  permissions: (c: Context) => Promise<string[] | null>
  /** Rend une page (le moteur nomme les siennes `forge/ResourceIndex|Show|Form`
   *  et injecte `prefix` dans les props). */
  render: (c: Context, page: string, props: Record<string, unknown>) => Promise<Response> | Response
  /** Rend avec erreurs de validation (clés de champs + `_form`). */
  renderErrors: (
    c: Context,
    page: string,
    props: Record<string, unknown>,
    errors: Record<string, string>,
  ) => Promise<Response> | Response
  /** Réponse de redirection (303 recommandé pour Inertia). */
  redirect: (to: string) => Response
  /** Anti-CSRF des mutations : renvoie false si la requête n'est pas same-origin.
   *  Injecté (le moteur reste agnostique). Absent → seul le cookie SameSite protège. */
  sameOrigin?: (c: Context) => boolean
  /** Préfixe d'URL où l'hôte MONTE ce routeur (`app.route(prefix, forge)`).
   *  Toutes les URLs générées (nav, redirects, hrefs) en dérivent, et le kit ui
   *  le reçoit via les props de page. Défaut : `/admin`. */
  prefix?: string
}

/** Builds the generic CRUD router (Hono) over every registered resource:
 *  list (search, faceted filters, sort, pagination), detail (+ `hasMany`
 *  sections), forms, mutations (validation, RBAC, CSRF guard, hooks). Mount it
 *  at the same prefix as `ctx.prefix`: `app.route("/admin", router)`. */
export function createForgeRouter(ctx: ForgeContext): Hono {
  const app = new Hono()
  // Fixé pour tout le process (forgeNav() en dépend aussi).
  const prefix = setForgePrefix(ctx.prefix)

  // La couche données : adapter explicite, ou sucre `query` → Postgres.
  const db: ForgeAdapter = ctx.adapter ?? (() => {
    if (!ctx.query) {
      throw new Error(
        "Forge: fournir `adapter` (ForgeAdapter) ou `query` (exécuteur SQL Postgres).",
      )
    }
    return postgresAdapter({ query: ctx.query })
  })()

  /** Rendu avec le préfixe injecté dans les props (le kit ui le consomme pour
   *  construire ses URLs — jamais de `/admin` en dur côté front). */
  const render = (c: Context, page: string, props: Record<string, unknown>) =>
    ctx.render(c, page, { ...props, prefix })
  const renderErrors = (
    c: Context,
    page: string,
    props: Record<string, unknown>,
    errors: Record<string, string>,
  ) => ctx.renderErrors(c, page, { ...props, prefix }, errors)

  /** Colonne d'ÉCRITURE d'un champ (celle que collect() vise). */
  function writeCol(f: Field): string {
    return f.writeColumn ??
      (f.type === "belongsTo" && f.relation ? f.relation.column : (f.column ?? f.key))
  }

  // Méta des champs éditables (formulaire). Pour belongsTo : injecte les OPTIONS
  // (les enregistrements liés). `locked` : champ à permission que l'opérateur n'a
  // pas → affiché en lecture seule (et refusé côté serveur par collect()).
  // `hideColumn` : champ injecté par un scope de création → retiré du formulaire
  // (un pivot devient ainsi créable depuis SES DEUX côtés).
  async function formMeta(def: ResourceDef, perms: string[], hideColumn?: string) {
    const fields = []
    for (const f of def.fields.filter((x) => x.editable)) {
      if (hideColumn && writeCol(f) === hideColumn) continue
      const pf = publicField(f)
      if (f.type === "belongsTo" && f.relation) {
        const rel = getResource(f.relation.resource)
        pf.options = await db.relationOptions(
          { table: rel?.table ?? f.relation.resource, softDelete: rel?.softDelete },
          f.relation.labelField,
        )
      }
      fields.push({ ...pf, locked: !!f.permission && !perms.includes(f.permission) })
    }
    return { name: def.name, label: def.label, fields }
  }

  async function guard(c: Context, perm?: string): Promise<string[] | Response> {
    const perms = await ctx.permissions(c)
    if (!perms) return ctx.redirect("/login")
    if (perm && !perms.includes(perm)) return ctx.redirect("/")
    return perms
  }

  /** Garde des MUTATIONS : anti-CSRF (same-origin) PUIS permission. */
  function guardWrite(c: Context, perm: string): Promise<string[] | Response> {
    if (ctx.sameOrigin && !ctx.sameOrigin(c)) return Promise.resolve(ctx.redirect("/"))
    return guard(c, perm)
  }

  /** Valide + extrait les valeurs des champs éditables depuis le body, indexées
   *  par COLONNE D'ÉCRITURE. Les champs dont l'opérateur n'a pas la permission
   *  sont IGNORÉS (sécurité : jamais écrits, même si le client les soumet).
   *  `skipColumn` : champ couvert par un scope de création (injecté serveur) →
   *  ni requis, ni lu depuis le body. */
  function collect(
    def: ResourceDef,
    body: Row,
    perms: string[],
    skipColumn?: string,
    isCreate = false,
  ) {
    const errors: Record<string, string> = {}
    const values: Row = {}
    for (const f of def.fields.filter((x) => x.editable)) {
      if (f.permission && !perms.includes(f.permission)) {
        // Champ verrouillé (permission manquante) : ignoré à l'écriture. Mais s'il
        // est REQUIS à la CRÉATION, l'ignorer violerait NOT NULL avec une erreur
        // DB cryptique → on le dit clairement.
        if (isCreate && f.required) {
          errors[f.key] = "Champ réservé et requis : vous ne pouvez pas créer cet enregistrement."
        }
        continue
      }
      const col = writeCol(f)
      if (skipColumn && col === skipColumn) continue
      const v = body[f.key]
      if (f.required && (v === null || v === undefined || v === "")) {
        errors[f.key] = "Requis."
        continue
      }
      if (
        (f.type === "select" || f.type === "badge") && f.options && v != null && v !== "" &&
        !f.options.some((o) => o.value === String(v))
      ) {
        errors[f.key] = "Valeur invalide."
        continue
      }
      values[col] = v === "" ? null : v ?? null
    }
    return { errors, values }
  }

  // Résout un scope de création (enfant créé depuis le détail d'un parent).
  // SÛR : la FK n'est acceptée que si une relation hasMany `create:true` du parent
  // la déclare ET pointe bien vers cette resource enfant (pas de colonne arbitraire).
  function resolveScope(childName: string, c: Context):
    | { foreignKey: string; parentDef: ResourceDef; parentId: string; via: string }
    | null {
    const via = c.req.query("via") // "<parentResource>.<hasManyKey>"
    const parent = c.req.query("parent")
    if (!via || !parent) return null
    const [parentName, hmKey] = via.split(".")
    const parentDef = getResource(parentName)
    const hm = parentDef?.hasMany?.find((h) => h.key === hmKey)
    if (!parentDef || !hm || hm.resource !== childName || !hm.create) return null
    return { foreignKey: hm.foreignKey, parentDef, parentId: parent, via }
  }

  // Payload front d'un scope : libellé du parent (premier champ) pour la bannière.
  async function scopeProp(scope: ReturnType<typeof resolveScope>) {
    if (!scope) return null
    const p = scope.parentDef
    const f0 = p.fields.find((f) => f.list !== false) ?? p.fields[0]
    let label = `#${scope.parentId}`
    if (f0) {
      const v = (await db.get(p, scope.parentId))?.[f0.key]
      if (v != null) {
        label = typeof v === "object"
          ? String((v as { label?: unknown }).label ?? scope.parentId)
          : String(v)
      }
    }
    return {
      via: scope.via,
      parent: scope.parentId,
      label,
      parentLabel: p.label,
      backHref: `${prefix}/${p.name}/${scope.parentId}`,
    }
  }

  // ── Racine du CRUD (`GET <prefix>`) : redirige vers la première entrée de
  // nav du périmètre — cible sûre pour un login ou un lien nu vers l'admin. ──
  app.get("/", (c) => {
    const first = forgeNav().find((e) => e.href.startsWith(`${prefix}/`))
    return ctx.redirect(first?.href ?? "/")
  })

  // ── Liste ──
  app.get("/:resource", async (c) => {
    const def = getResource(c.req.param("resource"))
    if (!def) return ctx.redirect("/")
    const perms = await guard(c, `${def.policy}.read`)
    if (perms instanceof Response) return perms

    const listFields = def.fields.filter((f) => f.list !== false)

    // ── Recherche + filtres facettés `f_<key>=<valeur>` sur les champs À
    // OPTIONS (badge/select) — la valeur doit exister dans les options
    // (code-defined) ; l'adapter ne reçoit que du whitelisté. ──
    const q = (c.req.query("q") ?? "").trim()
    const filters: Record<string, string> = {}
    const filterList: NonNullable<ListWhere["filters"]> = []
    for (const f of listFields) {
      if (!f.options?.length) continue
      const value = c.req.query(`f_${f.key}`)
      if (value == null || value === "") continue
      if (!f.options.some((o) => o.value === value)) continue
      filters[f.key] = value
      filterList.push({ field: f, value })
    }
    const where: ListWhere = { q, filters: filterList }

    // ── Tri (clé de champ whitelistée) + pagination ──
    const sortKey = c.req.query("sort") ?? ""
    const dir = c.req.query("dir") === "asc" ? "asc" as const : "desc" as const
    const sortField = sortKey ? listFields.find((f) => f.key === sortKey) : undefined

    const per = Math.min(100, Math.max(5, Number(c.req.query("per")) || 25))
    const total = await db.count(def, where)
    const pages = Math.max(1, Math.ceil(total / per))
    const page = Math.min(pages, Math.max(1, Number(c.req.query("page")) || 1))

    const rows = await db.list(def, {
      ...where,
      fields: listFields,
      sort: sortField ? { field: sortField, dir } : undefined,
      limit: per,
      offset: (page - 1) * per,
    })

    const canWrite = perms.includes(`${def.policy}.write`)

    // Actions de liste (import, export…) : filtrées par permission, sans `:id`.
    const listActions = (def.listActions ?? [])
      .filter((a) => {
        const perm = a.permission ?? `${def.policy}.write`
        return !perm || perms.includes(perm)
      })
      .map((a) => ({
        key: a.key,
        label: a.label,
        icon: a.icon,
        variant: a.variant ?? "outline",
        confirm: a.confirm,
        data: a.data ?? {},
        href: a.href,
        link: a.link ?? false,
      }))

    return render(c, forgePage("ResourceIndex"), {
      resource: { name: def.name, label: def.label, fields: listFields.map(publicField) },
      rows,
      q,
      sort: sortField ? { key: sortField.key, dir } : { key: "", dir: "desc" },
      filters,
      pagination: { page, per, total, pages },
      canCreate: def.create !== false && canWrite,
      canWrite,
      canDelete: def.delete !== false && canWrite,
      listActions,
    })
  })

  // ── Création : formulaire vide (standalone ou scoped depuis un parent) ──
  app.get("/:resource/create", async (c) => {
    const def = getResource(c.req.param("resource"))
    if (!def) return ctx.redirect("/")
    const scope = resolveScope(def.name, c)
    if (def.create === false && !scope) return ctx.redirect(`${prefix}/${def.name}`)
    const perms = await guard(c, `${def.policy}.write`)
    if (perms instanceof Response) return perms
    return render(c, forgePage("ResourceForm"), {
      resource: await formMeta(def, perms, scope?.foreignKey),
      row: {},
      mode: "create",
      scope: await scopeProp(scope),
    })
  })

  // ── Création : enregistrement ──
  app.post("/:resource", async (c) => {
    const def = getResource(c.req.param("resource"))
    if (!def) return ctx.redirect("/")
    const scope = resolveScope(def.name, c)
    if (def.create === false && !scope) return ctx.redirect(`${prefix}/${def.name}`)
    const perms = await guardWrite(c, `${def.policy}.write`)
    if (perms instanceof Response) return perms
    const body = await c.req.json().catch(() => ({})) as Row
    const { errors, values } = collect(def, body, perms, scope?.foreignKey, true)
    if (Object.keys(errors).length > 0) {
      return renderErrors(c, forgePage("ResourceForm"), {
        resource: await formMeta(def, perms, scope?.foreignKey),
        row: body,
        mode: "create",
        scope: await scopeProp(scope),
      }, errors)
    }
    // Scope : injecte la FK du parent (whitelistée par resolveScope).
    if (scope && !(scope.foreignKey in values)) values[scope.foreignKey] = scope.parentId
    try {
      const id = await db.create(def, values)
      if (def.hooks?.afterCreate && id != null) await def.hooks.afterCreate({ id })
      return ctx.redirect(
        scope
          ? `${prefix}/${scope.parentDef.name}/${scope.parentId}`
          : id != null
          ? `${prefix}/${def.name}/${id}`
          : `${prefix}/${def.name}`,
      )
    } catch {
      return renderErrors(c, forgePage("ResourceForm"), {
        resource: await formMeta(def, perms, scope?.foreignKey),
        row: body,
        mode: "create",
        scope: await scopeProp(scope),
      }, { _form: "Enregistrement impossible (doublon ou contrainte non respectée)." })
    }
  })

  // ── Édition : formulaire ──
  app.get("/:resource/:id/edit", async (c) => {
    const def = getResource(c.req.param("resource"))
    if (!def) return ctx.redirect("/")
    const perms = await guard(c, `${def.policy}.write`)
    if (perms instanceof Response) return perms
    const row = await db.get(def, c.req.param("id"))
    if (!row) return ctx.redirect(`${prefix}/${def.name}`)
    return render(c, forgePage("ResourceForm"), {
      resource: await formMeta(def, perms),
      row,
      mode: "edit",
    })
  })

  // ── Suppression (soft si configuré) ──
  app.post("/:resource/:id/delete", async (c) => {
    const def = getResource(c.req.param("resource"))
    if (!def || def.delete === false) return ctx.redirect(`${prefix}/${def?.name ?? ""}`)
    const perms = await guardWrite(c, `${def.policy}.write`)
    if (perms instanceof Response) return perms
    const id = c.req.param("id")
    // État avant suppression (ligne COMPLÈTE, pas la projection des champs :
    // le hook a souvent besoin d'une FK non déclarée, ex. le blueprint d'un bloc).
    const before = def.hooks?.afterDelete ? await db.getRaw(def, id) : null
    await db.delete(def, id)
    if (def.hooks?.afterDelete) await def.hooks.afterDelete({ id, row: before })
    return ctx.redirect(`${prefix}/${def.name}`)
  })

  // ── Détail ──
  app.get("/:resource/:id", async (c) => {
    const def = getResource(c.req.param("resource"))
    if (!def) return ctx.redirect("/")
    const perms = await guard(c, `${def.policy}.read`)
    if (perms instanceof Response) return perms
    const id = c.req.param("id")
    const row = await db.get(def, id)
    if (!row) return ctx.redirect(`${prefix}/${def.name}`)

    // Sections hasMany : les enfants pointant vers cet id. RBAC : une section
    // n'apparaît PAS si l'opérateur n'a pas la permission `read` de la resource
    // ENFANT (ex. l'onglet KYC est invisible sans customers.kyc.read).
    const hasMany = []
    for (const hm of def.hasMany ?? []) {
      const child = getResource(hm.resource)
      if (!child) continue
      if (child.policy && !perms.includes(`${child.policy}.read`)) continue
      const fields = hm.columns
        .map((k) => child.fields.find((f) => f.key === k))
        .filter((f): f is Field => !!f)
      const rows = await db.children(child, hm.foreignKey, id, fields)
      const childWrite = !child.policy || perms.includes(`${child.policy}.write`)
      hasMany.push({
        key: hm.key,
        label: hm.label ?? hm.key,
        resource: hm.resource,
        fields: fields.map(publicField),
        rows,
        canCreate: hm.create === true && childWrite,
        createHref: `${prefix}/${hm.resource}/create?via=${def.name}.${hm.key}&parent=${id}`,
      })
    }

    const canWrite = perms.includes(`${def.policy}.write`)

    // Actions custom : filtrées par permission + condition de visibilité (la
    // ligne est connue ici), `:id` résolu. Le front ne fait que rendre + POST.
    const actions = (def.actions ?? [])
      .filter((a) => {
        const perm = a.permission ?? `${def.policy}.write`
        if (perm && !perms.includes(perm)) return false
        const w = a.visibleWhen
        if (w) {
          const v = row[w.field]
          if (w.equals !== undefined && v !== w.equals) return false
          if (w.notEquals !== undefined && v === w.notEquals) return false
        }
        return true
      })
      .map((a) => ({
        key: a.key,
        label: a.label,
        icon: a.icon,
        variant: a.variant ?? "outline",
        confirm: a.confirm,
        data: a.data ?? {},
        href: a.href.replace(":id", String(id)),
        link: a.link ?? false,
      }))

    return render(c, forgePage("ResourceShow"), {
      resource: { name: def.name, label: def.label, fields: def.fields.map(publicField) },
      row,
      canWrite,
      canDelete: def.delete !== false && canWrite,
      hasMany,
      tabs: def.tabs === true,
      actions,
    })
  })

  // ── Mise à jour ──
  app.post("/:resource/:id", async (c) => {
    const def = getResource(c.req.param("resource"))
    if (!def) return ctx.redirect("/")
    const perms = await guardWrite(c, `${def.policy}.write`)
    if (perms instanceof Response) return perms
    const id = c.req.param("id")
    const body = await c.req.json().catch(() => ({})) as Row
    const { errors, values } = collect(def, body, perms)
    if (Object.keys(errors).length > 0) {
      return renderErrors(c, forgePage("ResourceForm"), {
        resource: await formMeta(def, perms),
        row: { id, ...body },
        mode: "edit",
      }, errors)
    }
    // État avant écriture (pour le diff transmis au hook afterUpdate).
    const before = def.hooks?.afterUpdate ? await db.get(def, id) : null
    if (Object.keys(values).length > 0) {
      try {
        await db.update(def, id, values)
      } catch {
        return renderErrors(c, forgePage("ResourceForm"), {
          resource: await formMeta(def, perms),
          row: { id, ...body },
          mode: "edit",
        }, { _form: "Enregistrement impossible (doublon ou contrainte non respectée)." })
      }
      if (def.hooks?.afterUpdate) {
        const changed = def.fields
          .filter((f) => f.editable && !(f.permission && !perms.includes(f.permission)))
          .filter((f) => String(before?.[f.key] ?? "") !== String(body[f.key] ?? ""))
          .map((f) => f.key)
        await def.hooks.afterUpdate({ id, changed })
      }
    }
    return ctx.redirect(`${prefix}/${def.name}/${id}`)
  })

  return app
}
