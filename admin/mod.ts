/**
 * Forge — the plug-and-play admin panel for Deno (batteries-included facade).
 *
 * {@linkcode forge} wires Hono, Inertia (`@streemkit/inertia-deno`), the CRUD
 * router, static assets and a CSRF guard with sane defaults. Every part stays
 * replaceable (options + the `context` escape hatch). Advanced hosts can
 * assemble everything themselves with `@streemkit/forge/engine`.
 *
 * @example A complete back-office
 * ```ts
 * import { forge } from "@streemkit/forge"
 * import "./resources/products.ts"   // defineResource(...) side-effect
 *
 * const admin = forge({
 *   db: Deno.env.get("DATABASE_URL")!, // Postgres URL | { query } | ForgeAdapter
 *   permissions: "open",               // DEV ONLY — see the permissions guide
 * })
 *
 * admin.app.get("/api/health", (c) => c.json({ ok: true })) // your routes
 * Deno.serve(admin.fetch)
 * ```
 *
 * @module
 */

import { type Context, Hono } from "hono"
import { createInertia, pageToHtml, redirect } from "deno-inertia"
import { serveAssets, toWebRequest } from "deno-inertia/hono"
import {
  allPages,
  allResources,
  createForgeRouter,
  DEFAULT_ADMIN_PREFIX,
  type ForgeAdapter,
  type ForgeContext,
  forgeNav,
} from "../engine/mod.ts"
import { type DbOption, resolveDb } from "./db.ts"
import { type AuthApi, type AuthOptions, installAuth } from "./auth/mod.ts"

export { type DbOption, resolveDb, type SqlExecutor } from "./db.ts"
export { type AuthApi, type AuthDeps, type AuthOptions, installAuth } from "./auth/mod.ts"
export { hashPassword, verifyPassword } from "./auth/crypto.ts"
export {
  type Dialect,
  type MigrationStepDef,
  type Raw,
  runAuthMigrations,
  runMigrationSteps,
} from "./auth/migrations.ts"

/** A SERVER-side extension: packages the backend half of an optional feature
 *  (2FA, audit, notifications…) — routes, resources, pages, hooks — installed
 *  onto the assembled app. The frontend half goes through the UI kit's
 *  `installForgeExtensions`. Nothing optional ships by default. */
export interface ForgeExtension {
  /** Unique name (diagnostics). */
  name: string
  /** Called once, after the app is fully wired: add routes on `admin.app`,
   *  declare resources/pages, read `admin.prefix`, render with `admin.render`. */
  install: (admin: ForgeApp) => void
}

/** The `permissions` option: `"open"` (dev only — grants everything derived
 *  from the registry), a static list, or a per-request resolver (`null` =
 *  anonymous → redirect to `/login`). */
export type PermissionsOption =
  | "open"
  | string[]
  | ((c: Context) => Promise<string[] | null>)

/** Options of {@linkcode forge}. Only `db` is always required — provide either
 *  `permissions` or `auth`; everything else has a sane default. */
export interface ForgeOptions {
  /** Données : URL Postgres (driver intégré), exécuteur `{ query }`, ou
   *  ForgeAdapter complet (autre stockage). */
  db: DbOption
  /** RBAC : `"open"` = tout autorisé (DEV UNIQUEMENT, dérivé du registre),
   *  une liste statique, ou un résolveur par requête (`null` = anonyme).
   *  OPTIONNEL si `auth` est activé (le module fournit alors le résolveur,
   *  branché sur sessions + rôles stockés). */
  permissions?: PermissionsOption
  /** AUTH BUILTIN : sessions, login, admins et rôles/permissions stockés
   *  (tables système `forge_*`, migrées automatiquement au boot). `true` =
   *  options par défaut. Voir {@linkcode AuthOptions}. */
  auth?: AuthOptions | true
  /** Préfixe de montage du CRUD (défaut `/admin`). */
  prefix?: string
  /** Entrée front Vite (défaut `src/main.ts`). */
  entry?: string
  /** `<title>` du template HTML par défaut (défaut `Admin`). */
  title?: string
  /** Attribut `lang` du template HTML par défaut (défaut `en`). */
  lang?: string
  /** Template HTML complet (remplace `title`/`lang`). */
  template?: (page: unknown, assets: string) => string
  /** Props partagées Inertia supplémentaires (fusionnées au-dessus de
   *  `forge.nav` + `prefix`, fournis par la façade). */
  shared?: () => Record<string, unknown>
  /** Version des assets Inertia (défaut `1.0.0`). */
  version?: string
  /** Dossier des assets buildés, servi quand `prod` (défaut `dist`). */
  dist?: string
  /** Mode prod : sert `dist` statiquement (défaut : env `PROD_MODE === "1"`). */
  prod?: boolean
  /** Redirige `/` vers ce chemin (ex. `/admin/products`). Sinon `/` reste à toi. */
  home?: string
  /** Monte sur un Hono existant (défaut : nouveau). */
  app?: Hono
  /** Extensions serveur (2FA, audit…) : installées une fois l'app assemblée.
   *  Le pendant front passe par `installForgeExtensions` du kit ui. */
  extensions?: ForgeExtension[]
  /** Escape hatch : surcharge n'importe quel champ du ForgeContext assemblé
   *  (render, redirect, sameOrigin, adapter…). */
  context?: Partial<ForgeContext>
}

/** What {@linkcode forge} returns: the assembled app, ready for `Deno.serve`. */
export interface ForgeApp {
  /** Le Hono assemblé — ajoute tes routes métier dessus. */
  app: Hono
  /** Handler `Deno.serve(admin.fetch)`. */
  fetch: Hono["fetch"]
  /** L'instance Inertia (accès bas niveau). */
  inertia: ReturnType<typeof createInertia>
  /** Rend UNE de TES pages Inertia depuis une route Hono. */
  render: (
    c: Context,
    page: string,
    props?: Record<string, unknown>,
  ) => Promise<Response> | Response
  /** Le préfixe effectif du CRUD. */
  prefix: string
  /** L'adapter de données effectif — les extensions serveur s'en servent
   *  (via `adapter.raw` pour leurs migrations/requêtes système). */
  adapter: ForgeAdapter
  /** L'API du module d'auth builtin (présente si `auth` est activé) —
   *  `currentAdmin`, `createAdmin`, `elevate`/`isElevated` (extensions OTP). */
  auth?: AuthApi
}

/** Toutes les permissions dérivables du registre (resources, champs, actions,
 *  pages custom). C'est ce que `permissions: "open"` accorde. */
export function openPermissions(): string[] {
  const perms = new Set<string>()
  for (const r of allResources()) {
    perms.add(`${r.policy}.read`)
    perms.add(`${r.policy}.write`)
    for (const f of r.fields) if (f.permission) perms.add(f.permission)
    for (const a of [...(r.actions ?? []), ...(r.listActions ?? [])]) {
      if (a.permission) perms.add(a.permission)
    }
  }
  for (const p of allPages()) if (p.permission) perms.add(p.permission)
  return [...perms]
}

/** Anti-CSRF par défaut : `Sec-Fetch-Site` si présent, sinon comparaison
 *  d'Origin. Pas d'en-tête du tout (curl, vieux clients) → laissé passer :
 *  les navigateurs modernes envoient toujours l'un des deux en cross-site. */
export function defaultSameOrigin(c: Context): boolean {
  const sfs = c.req.header("sec-fetch-site")
  if (sfs) return sfs === "same-origin" || sfs === "none"
  const origin = c.req.header("origin")
  if (!origin) return true
  try {
    return new URL(origin).host === new URL(c.req.url).host
  } catch {
    return false
  }
}

function resolvePermissions(p: PermissionsOption): ForgeContext["permissions"] {
  if (p === "open") {
    console.warn(
      '[forge] permissions: "open" — TOUT est autorisé (mode dev). Ne pas déployer ainsi.',
    )
    // Dérivé À CHAQUE requête : le registre peut encore grossir après forge().
    return () => Promise.resolve(openPermissions())
  }
  if (Array.isArray(p)) return () => Promise.resolve(p)
  return p
}

/** Lecture d'env SANS dépendre du global `Deno` (compat Node/Bun/workers). */
function envGet(key: string): string | undefined {
  return (globalThis as { Deno?: { env: { get(k: string): string | undefined } } })
    .Deno?.env.get(key)
}

/** Builds the complete admin app: Hono + Inertia rendering + CRUD router +
 *  static assets + CSRF guard, with defaults everywhere. Add your own routes
 *  on `app`, then `Deno.serve(admin.fetch)`. */
export function forge(options: ForgeOptions): ForgeApp {
  const prefix = options.prefix ?? DEFAULT_ADMIN_PREFIX
  const app = options.app ?? new Hono()
  const prod = options.prod ?? envGet("PROD_MODE") === "1"

  const inertia = createInertia({
    version: options.version ?? "1.0.0",
    entry: options.entry ?? "src/main.ts",
    // Fourni à TOUTES les pages (CRUD et custom) : la nav unifiée + le préfixe.
    shared: () => ({ forge: { nav: forgeNav() }, prefix, ...options.shared?.() }),
    template: options.template ?? ((page, assets) =>
      `<!DOCTYPE html>
<html lang="${options.lang ?? "en"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title ?? "Admin"}</title>
  ${assets}
</head>
<body>${pageToHtml(page)}</body>
</html>`),
  })

  if (prod) app.use("/assets/*", serveAssets(options.dist ?? "dist"))

  const adapter = resolveDb(options.db)
  // deno-lint-ignore no-explicit-any
  const render: ForgeContext["render"] = (c, page, props) =>
    // deno-lint-ignore no-explicit-any
    inertia.render(toWebRequest(c), page, props as any)
  const renderErrors: ForgeContext["renderErrors"] = (c, page, props, errors) =>
    // deno-lint-ignore no-explicit-any
    inertia.renderWithErrors(toWebRequest(c), page, props as any, errors)
  const redirectTo: ForgeContext["redirect"] = (to) => redirect(to)
  const sameOrigin = options.context?.sameOrigin ?? defaultSameOrigin

  // AUTH BUILTIN — installé AVANT le montage CRUD (ses routes /login, /logout
  // et <prefix>/system/roles doivent gagner sur le catch-all /:resource).
  let auth: AuthApi | undefined
  if (options.auth) {
    auth = installAuth(app, {
      adapter,
      render,
      renderErrors,
      redirect: redirectTo,
      sameOrigin,
      prefix,
      title: options.title ?? "Admin",
      allPermissions: openPermissions,
    }, options.auth === true ? {} : options.auth)
  }

  const permissions = options.permissions
    ? resolvePermissions(options.permissions)
    : auth?.permissions
  if (!permissions) {
    throw new Error("Forge: fournir `permissions`, ou activer `auth` (qui fournit le résolveur).")
  }

  const ctx: ForgeContext = {
    adapter,
    permissions,
    render,
    renderErrors,
    redirect: redirectTo,
    sameOrigin,
    prefix,
    ...options.context,
  }

  const admin: ForgeApp = {
    app,
    fetch: app.fetch,
    inertia,
    // deno-lint-ignore no-explicit-any
    render: (c, page, props = {}) => inertia.render(toWebRequest(c), page, props as any),
    prefix,
    adapter,
    auth,
  }

  // Extensions serveur : AVANT le montage CRUD — leurs routes sous le préfixe
  // (ex. <prefix>/system/otp) doivent gagner sur le catch-all /:resource.
  for (const ext of options.extensions ?? []) ext.install(admin)

  app.route(prefix, createForgeRouter(ctx))
  if (options.home) {
    const home = options.home
    app.get("/", (c) => c.redirect(home))
  }

  return admin
}
