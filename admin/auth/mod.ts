// Forge · AUTH BUILTIN — sessions, login, RBAC stocké, le tout en dogfooding :
// les admins sont une resource Forge, les rôles une page du kit. S'active via
// `forge({ auth: { … } })`. Tables système `forge_*` (migrations.ts) — la table
// admin embarque le 2FA générique (totp_*) et la session porte `elevated_until`
// pour l'ÉLÉVATION (confirmation OTP d'actions sensibles, via extension).

import type { Context, Hono } from "hono"
import { getCookie } from "hono/cookie"
import {
  badge,
  belongsTo,
  date,
  definePage,
  defineResource,
  email,
  type ForgeAdapter,
  forgePage,
  type Row,
  text,
} from "../../engine/mod.ts"
import { hashPassword, randomToken, sha256hex, verifyPassword } from "./crypto.ts"
import { runAuthMigrations } from "./migrations.ts"

/** Options du module d'auth builtin (`forge({ auth: … })`). */
export interface AuthOptions {
  /** Crée le premier admin au boot s'il n'existe AUCUN admin (rôle Super admin). */
  seed?: { email: string; password: string; name?: string }
  /** Durée de vie d'une session, en heures. Défaut : `168` (7 jours). */
  sessionTtlHours?: number
  /** Nom du cookie de session. Défaut : `forge_session`. */
  cookieName?: string
}

/** Ce que la façade fournit au module (déjà assemblé). */
export interface AuthDeps {
  /** L'adapter de données (doit exposer `raw` pour les migrations). */
  adapter: ForgeAdapter
  /** Rend une page Inertia (celui du ForgeContext). */
  render: (c: Context, page: string, props: Record<string, unknown>) => Promise<Response> | Response
  /** Rend avec erreurs de validation. */
  renderErrors: (
    c: Context,
    page: string,
    props: Record<string, unknown>,
    errors: Record<string, string>,
  ) => Promise<Response> | Response
  /** Réponse de redirection (303). */
  redirect: (to: string) => Response
  /** Garde anti-CSRF des mutations. */
  sameOrigin: (c: Context) => boolean
  /** Préfixe de montage du CRUD. */
  prefix: string
  /** Titre affiché sur la page de login. */
  title: string
  /** Catalogue DYNAMIQUE des permissions connues (registre + extensions). */
  allPermissions: () => string[]
}

/** L'API rendue par `installAuth` — consommée par la façade et les extensions. */
export interface AuthApi {
  /** Résolveur de permissions par requête (branché sur la session + le rôle). */
  permissions: (c: Context) => Promise<string[] | null>
  /** L'admin de la session courante (`null` si anonyme). */
  currentAdmin: (c: Context) => Promise<{ id: string; email: string; name: string | null } | null>
  /** Marque la session courante ÉLEVÉE pour `minutes` (extension OTP). */
  elevate: (c: Context, minutes: number) => Promise<void>
  /** La session courante est-elle élevée ? (extension OTP / actions sensibles). */
  isElevated: (c: Context) => Promise<boolean>
  /** Crée un admin (hash inclus). `roleId` absent → rôle Super admin. */
  createAdmin: (
    input: { email: string; password: string; name?: string; roleId?: string },
  ) => Promise<string | null>
  /** Enregistre un CHALLENGE post-mot-de-passe (extensions 2FA) : appelé après
   *  vérification réussie, il renvoie une `Response` (page de challenge) pour
   *  INTERROMPRE la création de session, ou `null` pour laisser passer. */
  setLoginChallenge: (
    fn: (c: Context, admin: Row) => Promise<Response | null>,
  ) => void
  /** Termine un login (utilisé par les extensions après leur challenge) :
   *  crée la session, pose le cookie et redirige vers l'admin. */
  completeLogin: (c: Context, adminId: string) => Promise<Response>
  /** Promesse de fin d'init (migrations + seed) — les tests l'attendent. */
  ready: Promise<void>
}

const SUPER_ROLE = "Super admin"

/** Installe l'auth builtin sur l'app : migrations+seed (lazy), routes /login,
 *  /logout et `<prefix>/system/roles`, resources Administration (admins, rôles),
 *  résolveur de permissions. À appeler AVANT de monter le routeur CRUD. */
export function installAuth(app: Hono, deps: AuthDeps, options: AuthOptions = {}): AuthApi {
  const rawExec = deps.adapter.raw
  if (!rawExec) {
    throw new Error(
      "Forge auth: l'adapter ne fournit pas `raw` (exécuteur natif) — requis pour les migrations système.",
    )
  }
  // Rebind typé : le narrowing de la garde ne se propage pas dans les closures.
  const raw: (query: string, params?: unknown[]) => Promise<Row[]> = rawExec
  const cookieName = options.cookieName ?? "forge_session"
  const ttlHours = options.sessionTtlHours ?? 168

  // ── Init lazy : migrations + rôle Super admin + seed du premier admin. ──
  const ready = (async () => {
    await runAuthMigrations(raw)
    await raw(
      `INSERT INTO forge_roles (name, permissions) VALUES ($1, '["*"]') ON CONFLICT (name) DO NOTHING`,
      [SUPER_ROLE],
    )
    const admins = await raw(`SELECT COUNT(*)::int AS n FROM forge_admins`)
    if (Number(admins[0]?.n ?? 0) === 0) {
      if (options.seed) {
        await createAdmin(options.seed)
        console.log(`[forge] auth: admin initial créé (${options.seed.email}).`)
      } else {
        console.warn(
          "[forge] auth: aucun admin — passez `auth.seed: { email, password }` pour créer le premier.",
        )
      }
    }
  })()
  // Toutes les routes attendent l'init (une fois) — cold start compris.
  app.use("*", async (_c, next) => {
    await ready
    await next()
  })

  async function createAdmin(
    input: { email: string; password: string; name?: string; roleId?: string },
  ): Promise<string | null> {
    let roleId = input.roleId
    if (!roleId) {
      const role = await raw(`SELECT id FROM forge_roles WHERE name = $1`, [SUPER_ROLE])
      roleId = role[0]?.id != null ? String(role[0].id) : undefined
    }
    const created = await raw(
      `INSERT INTO forge_admins (email, name, password_hash, role_id) VALUES ($1, $2, $3, $4) RETURNING id`,
      [
        input.email.toLowerCase(),
        input.name ?? null,
        await hashPassword(input.password),
        roleId ?? null,
      ],
    )
    return created[0]?.id != null ? String(created[0].id) : null
  }

  // ── Sessions ──
  interface SessionRow extends Row {
    admin_id: unknown
    email: unknown
    name: unknown
    permissions: unknown
    elevated_until: unknown
  }

  async function sessionRow(c: Context): Promise<SessionRow | null> {
    const token = getCookie(c, cookieName)
    if (!token) return null
    const hash = await sha256hex(token)
    const rows = await raw(
      `SELECT s.admin_id, s.elevated_until, a.email, a.name, COALESCE(r.permissions, '[]') AS permissions
       FROM forge_sessions s
       JOIN forge_admins a ON a.id = s.admin_id AND a.disabled_at IS NULL
       LEFT JOIN forge_roles r ON r.id = a.role_id
       WHERE s.token_hash = $1 AND s.expires_at > now() LIMIT 1`,
      [hash],
    )
    return (rows[0] as SessionRow | undefined) ?? null
  }

  function parsePermissions(value: unknown): string[] {
    try {
      const arr = JSON.parse(String(value ?? "[]"))
      return Array.isArray(arr) ? arr.map(String) : []
    } catch {
      return []
    }
  }

  /** Attache un Set-Cookie à une réponse existante (les redirects sont des
   *  Response brutes — les en-têtes posés sur `c` n'y seraient pas fusionnés). */
  function withCookie(res: Response, c: Context, value: string, maxAge: number): Response {
    const secure = new URL(c.req.url).protocol === "https:" ? "; Secure" : ""
    const headers = new Headers(res.headers)
    headers.append(
      "set-cookie",
      `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`,
    )
    return new Response(res.body, { status: res.status, headers })
  }

  // Hash factice : le POST /login prend le même temps que l'email existe ou non
  // (limite l'énumération d'utilisateurs par timing).
  const dummyHash = hashPassword("forge-dummy-password")

  // Challenge post-mot-de-passe (2FA) — enregistré par une extension.
  let loginChallenge: ((c: Context, admin: Row) => Promise<Response | null>) | null = null

  /** Crée la session + cookie et redirige vers l'admin. */
  async function completeLogin(c: Context, adminId: string): Promise<Response> {
    const token = randomToken()
    await raw(
      `INSERT INTO forge_sessions (token_hash, admin_id, expires_at)
       VALUES ($1, $2, now() + ($3 || ' hours')::interval)`,
      [await sha256hex(token), adminId, String(ttlHours)],
    )
    return withCookie(deps.redirect(deps.prefix || "/"), c, token, ttlHours * 3600)
  }

  // ── Routes d'authentification (racine, hors préfixe). ──
  app.get("/login", async (c) => {
    if (await sessionRow(c)) return deps.redirect(deps.prefix || "/")
    return deps.render(c, forgePage("Login"), { title: deps.title })
  })

  app.post("/login", async (c) => {
    if (!deps.sameOrigin(c)) return deps.redirect("/login")
    const body = await c.req.json().catch(() => ({})) as { email?: string; password?: string }
    const emailInput = String(body.email ?? "").toLowerCase().trim()
    const rows = emailInput
      ? await raw(
        `SELECT id, password_hash FROM forge_admins WHERE email = $1 AND disabled_at IS NULL`,
        [emailInput],
      )
      : []
    const stored = rows[0]?.password_hash != null ? String(rows[0].password_hash) : await dummyHash
    const ok = await verifyPassword(String(body.password ?? ""), stored) && rows.length > 0
    if (!ok) {
      return deps.renderErrors(c, forgePage("Login"), { title: deps.title }, {
        _form: "Identifiants invalides.",
      })
    }
    // Challenge post-mot-de-passe (2FA) : une extension peut interrompre ici.
    if (loginChallenge) {
      const full = await raw(`SELECT * FROM forge_admins WHERE id = $1`, [rows[0].id])
      const challenge = await loginChallenge(c, full[0] ?? rows[0])
      if (challenge) return challenge
    }
    return await completeLogin(c, String(rows[0].id))
  })

  app.post("/logout", async (c) => {
    const token = getCookie(c, cookieName)
    if (token) {
      await raw(`DELETE FROM forge_sessions WHERE token_hash = $1`, [await sha256hex(token)])
    }
    return withCookie(deps.redirect("/login"), c, "", 0)
  })

  // ── Page PROFIL : le compte de l'admin CONNECTÉ (identité, mot de passe).
  // Les extensions s'y ajoutent via l'outlet `profile:sections` du kit. ──
  const profilePath = `${deps.prefix}/system/profile`

  async function profileProps(c: Context): Promise<Record<string, unknown> | null> {
    const s = await sessionRow(c)
    if (!s) return null
    const rows = await raw(
      `SELECT a.email, a.name, r.name AS role FROM forge_admins a
       LEFT JOIN forge_roles r ON r.id = a.role_id WHERE a.id = $1`,
      [s.admin_id],
    )
    const me = rows[0]
    return me
      ? {
        admin: {
          email: String(me.email),
          name: me.name == null ? null : String(me.name),
          role: me.role == null ? null : String(me.role),
        },
        prefix: deps.prefix,
      }
      : null
  }

  app.get(profilePath, async (c) => {
    const props = await profileProps(c)
    if (!props) return deps.redirect("/login")
    return deps.render(c, forgePage("Profile"), props)
  })

  // Identité (nom affiché).
  app.post(profilePath, async (c) => {
    if (!deps.sameOrigin(c)) return deps.redirect("/login")
    const s = await sessionRow(c)
    if (!s) return deps.redirect("/login")
    const body = await c.req.json().catch(() => ({})) as { name?: string }
    await raw(`UPDATE forge_admins SET name = NULLIF($1, '') WHERE id = $2`, [
      String(body.name ?? "").trim(),
      s.admin_id,
    ])
    return deps.redirect(profilePath)
  })

  // Changement de mot de passe (l'actuel est exigé et vérifié).
  app.post(`${profilePath}/password`, async (c) => {
    if (!deps.sameOrigin(c)) return deps.redirect("/login")
    const s = await sessionRow(c)
    if (!s) return deps.redirect("/login")
    const body = await c.req.json().catch(() => ({})) as { current?: string; next?: string }
    const me = await raw(`SELECT password_hash FROM forge_admins WHERE id = $1`, [s.admin_id])
    const props = (await profileProps(c))!
    if (!(await verifyPassword(String(body.current ?? ""), String(me[0]?.password_hash ?? "")))) {
      return deps.renderErrors(c, forgePage("Profile"), props, {
        current: "Mot de passe actuel incorrect.",
      })
    }
    const next = String(body.next ?? "")
    if (next.length < 8) {
      return deps.renderErrors(c, forgePage("Profile"), props, {
        next: "8 caractères minimum.",
      })
    }
    await raw(`UPDATE forge_admins SET password_hash = $1 WHERE id = $2`, [
      await hashPassword(next),
      s.admin_id,
    ])
    return deps.redirect(profilePath)
  })

  definePage({
    name: "forge-profile",
    href: profilePath,
    label: "Profil",
    nav: { group: "Administration", label: "Profil", icon: "user", order: 88 },
  })

  // ── Page RÔLES & PERMISSIONS (custom, catalogue DYNAMIQUE par requête). ──
  const rolesPath = `${deps.prefix}/system/roles`

  async function guardRoles(c: Context, write: boolean): Promise<string[] | Response> {
    const perms = await api.permissions(c)
    if (!perms) return deps.redirect("/login")
    const needed = write ? "forge.roles.write" : "forge.roles.read"
    if (!perms.includes(needed)) return deps.redirect("/")
    return perms
  }

  app.get(rolesPath, async (c) => {
    const perms = await guardRoles(c, false)
    if (perms instanceof Response) return perms
    const rows = await raw(`SELECT id, name, permissions FROM forge_roles ORDER BY id`)
    return deps.render(c, forgePage("Roles"), {
      roles: rows.map((r) => ({
        id: r.id,
        name: String(r.name),
        permissions: parsePermissions(r.permissions),
      })),
      catalog: deps.allPermissions().sort(),
      prefix: deps.prefix,
    })
  })

  app.post(rolesPath, async (c) => {
    if (!deps.sameOrigin(c)) return deps.redirect("/")
    const perms = await guardRoles(c, true)
    if (perms instanceof Response) return perms
    const body = await c.req.json().catch(() => ({})) as { name?: string }
    const name = String(body.name ?? "").trim()
    if (name) {
      await raw(
        `INSERT INTO forge_roles (name, permissions) VALUES ($1, '[]') ON CONFLICT (name) DO NOTHING`,
        [name],
      )
    }
    return deps.redirect(rolesPath)
  })

  app.post(`${rolesPath}/:id`, async (c) => {
    if (!deps.sameOrigin(c)) return deps.redirect("/")
    const perms = await guardRoles(c, true)
    if (perms instanceof Response) return perms
    const body = await c.req.json().catch(() => ({})) as { name?: string; permissions?: unknown }
    const name = String(body.name ?? "").trim()
    const list = Array.isArray(body.permissions) ? body.permissions.map(String) : []
    await raw(
      `UPDATE forge_roles SET name = COALESCE(NULLIF($1, ''), name), permissions = $2 WHERE id = $3`,
      [name, JSON.stringify(list), c.req.param("id")],
    )
    return deps.redirect(rolesPath)
  })

  app.post(`${rolesPath}/:id/delete`, async (c) => {
    if (!deps.sameOrigin(c)) return deps.redirect("/")
    const perms = await guardRoles(c, true)
    if (perms instanceof Response) return perms
    const id = c.req.param("id")
    // Les admins du rôle supprimé perdent leur rôle (documenté) — jamais le Super admin.
    const role = await raw(`SELECT name FROM forge_roles WHERE id = $1`, [id])
    if (role[0] && String(role[0].name) !== SUPER_ROLE) {
      await raw(`UPDATE forge_admins SET role_id = NULL WHERE role_id = $1`, [id])
      await raw(`DELETE FROM forge_roles WHERE id = $1`, [id])
    }
    return deps.redirect(rolesPath)
  })

  // ── Dogfooding : les tables système sont des resources Forge. ──
  // Cible du belongsTo (cachée du menu — l'édition passe par la page Rôles).
  defineResource({
    name: "forge-roles",
    table: "forge_roles",
    label: "Rôles",
    policy: "forge.roles",
    create: false,
    delete: false,
    fields: [text("name", { label: "Nom" })],
  })

  defineResource({
    name: "forge-admins",
    table: "forge_admins",
    label: "Admins",
    policy: "forge.admins",
    create: false, // création via seed / createAdmin (le hash ne passe pas par le CRUD)
    delete: false, // désactivation plutôt que suppression (disabled_at)
    search: ["email", "name"],
    nav: { group: "Administration", label: "Admins", icon: "shield", order: 90 },
    fields: [
      email("email", { label: "Email", searchable: true }),
      text("name", { label: "Nom", editable: true, searchable: true }),
      belongsTo("role", {
        resource: "forge-roles",
        column: "role_id",
        labelField: "name",
        label: "Rôle",
        editable: true,
      }),
      badge("totp_enabled", {
        label: "2FA",
        column: `totp_enabled::text`,
        options: [
          { value: "true", label: "Activée", tone: "success" },
          { value: "false", label: "—", tone: "muted" },
        ],
      }),
      badge("status", {
        label: "Statut",
        column: `(disabled_at IS NULL)::text`,
        options: [
          { value: "true", label: "Actif", tone: "success" },
          { value: "false", label: "Désactivé", tone: "danger" },
        ],
      }),
      date("created_at", {
        label: "Créé le",
        column: `(EXTRACT(EPOCH FROM created_at) * 1000)::float8`,
      }),
    ],
  })

  definePage({
    name: "forge-roles-editor",
    href: rolesPath,
    label: "Rôles",
    nav: { group: "Administration", label: "Rôles & permissions", icon: "key", order: 91 },
    permission: "forge.roles.read",
  })

  const api: AuthApi = {
    ready,
    createAdmin,
    completeLogin,
    setLoginChallenge: (fn) => {
      loginChallenge = fn
    },
    currentAdmin: async (c) => {
      const s = await sessionRow(c)
      return s
        ? {
          id: String(s.admin_id),
          email: String(s.email),
          name: s.name == null ? null : String(s.name),
        }
        : null
    },
    permissions: async (c) => {
      const s = await sessionRow(c)
      if (!s) return null
      const perms = parsePermissions(s.permissions)
      return perms.includes("*") ? deps.allPermissions() : perms
    },
    elevate: async (c, minutes) => {
      const token = getCookie(c, cookieName)
      if (!token) return
      await raw(
        `UPDATE forge_sessions SET elevated_until = now() + ($2 || ' minutes')::interval WHERE token_hash = $1`,
        [await sha256hex(token), String(minutes)],
      )
    },
    isElevated: async (c) => {
      const s = await sessionRow(c)
      return s?.elevated_until != null && new Date(String(s.elevated_until)).getTime() > Date.now()
    },
  }
  return api
}
