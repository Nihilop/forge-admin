// Forge · FAÇADE « batteries incluses » — le mode plug-and-play au-dessus du
// moteur agnostique. `forge(options)` assemble Hono + Inertia (deno-inertia) +
// routeur CRUD + assets avec des DÉFAUTS partout ; chaque brique reste
// remplaçable (options + `context` en escape hatch). L'utilisateur avancé
// continue d'utiliser `createForgeRouter` + son propre ForgeContext.
//
//   import { forge } from "forge/admin"
//   import "./resources/products.ts"
//   const admin = forge({ db: Deno.env.get("DATABASE_URL")!, permissions: "open" })
//   admin.app.get("/", (c) => admin.render(c, "Dashboard", { … }))  // tes routes
//   Deno.serve(admin.fetch)

import { type Context, Hono } from "hono"
import { createInertia, pageToHtml, redirect } from "deno-inertia"
import { serveAssets, toWebRequest } from "deno-inertia/hono"
import {
  allPages,
  allResources,
  createForgeRouter,
  DEFAULT_ADMIN_PREFIX,
  type ForgeContext,
  forgeNav,
} from "forge/engine"
import { type DbOption, resolveDb } from "./db.ts"

export { type DbOption, resolveDb, type SqlExecutor } from "./db.ts"

export type PermissionsOption =
  | "open"
  | string[]
  | ((c: Context) => Promise<string[] | null>)

export interface ForgeOptions {
  /** Données : URL Postgres (driver intégré), exécuteur `{ query }`, ou
   *  ForgeAdapter complet (autre stockage). */
  db: DbOption
  /** RBAC : `"open"` = tout autorisé (DEV UNIQUEMENT, dérivé du registre),
   *  une liste statique, ou un résolveur par requête (`null` = anonyme). */
  permissions: PermissionsOption
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
  /** Escape hatch : surcharge n'importe quel champ du ForgeContext assemblé
   *  (render, redirect, sameOrigin, adapter…). */
  context?: Partial<ForgeContext>
}

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

export function forge(options: ForgeOptions): ForgeApp {
  const prefix = options.prefix ?? DEFAULT_ADMIN_PREFIX
  const app = options.app ?? new Hono()
  const prod = options.prod ?? Deno.env.get("PROD_MODE") === "1"

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

  const ctx: ForgeContext = {
    adapter: resolveDb(options.db),
    permissions: resolvePermissions(options.permissions),
    // deno-lint-ignore no-explicit-any
    render: (c, page, props) => inertia.render(toWebRequest(c), page, props as any),
    renderErrors: (c, page, props, errors) =>
      // deno-lint-ignore no-explicit-any
      inertia.renderWithErrors(toWebRequest(c), page, props as any, errors),
    redirect: (to) => redirect(to),
    sameOrigin: defaultSameOrigin,
    prefix,
    ...options.context,
  }

  app.route(prefix, createForgeRouter(ctx))
  if (options.home) {
    const home = options.home
    app.get("/", (c) => c.redirect(home))
  }

  return {
    app,
    fetch: app.fetch,
    inertia,
    // deno-lint-ignore no-explicit-any
    render: (c, page, props = {}) => inertia.render(toWebRequest(c), page, props as any),
    prefix,
  }
}
