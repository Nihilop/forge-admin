// APP EXEMPLE — une petite app Deno qui consomme la FAÇADE forge() comme le
// ferait un dev externe : DB (PGlite), resources déclarées, dashboard custom,
// endpoints métier + API JSON à côté du CRUD. Tout le câblage Hono/Inertia/
// routeur/assets est fait par la façade ; l'app garde SES routes.

import { redirect } from "deno-inertia"
import { forge } from "forge/admin"
import { definePage } from "forge/engine"
import { otpApiOf, otpServer } from "../extensions/otp/mod.ts"
import { query } from "./db.ts"

// Enregistre les resources de l'app (side-effect).
import "./resources/products.ts"
import "./resources/orders.ts"

// Préfixe du CRUD. `ADMIN_PREFIX=/back deno task serve` pour tester un autre.
const ADMIN_PREFIX = Deno.env.get("ADMIN_PREFIX") ?? "/admin"

// ── Page CUSTOM : le dashboard. `definePage` ajoute l'entrée de MENU ; la
// route "/" et le composant (src/pages/Dashboard.vue) sont possédés par l'app.
definePage({
  name: "dashboard",
  href: "/",
  label: "Vue d'ensemble",
  nav: { group: "Général", label: "Vue d'ensemble", icon: "gauge", order: 0 },
  exact: true,
})

// ── La façade : Hono + Inertia + CRUD + assets + AUTH BUILTIN. ──
// Le playground utilise l'auth réelle (login, sessions, rôles) — identifiants
// de démo seedés au boot (PGlite en mémoire → recréés à chaque démarrage).
const admin = forge({
  db: { query }, // PGlite de l'app ; en prod réelle : db: DATABASE_URL
  auth: { seed: { email: "admin@forge.dev", password: "forge-dev", name: "Admin" } },
  prefix: ADMIN_PREFIX,
  title: "Forge — dev",
  lang: "fr",
  // Extension OTP/2FA (fournie avec la lib, opt-in) : challenge au login si
  // 2FA activée, page Sécurité (2FA), élévation des actions sensibles.
  extensions: [otpServer({ issuer: "Forge dev" })],
})
const otp = otpApiOf(admin)
console.log("Login démo → admin@forge.dev / forge-dev")

// ── Les routes de l'APP (Forge ne les connaît pas). ──

/** Stats du dashboard, calculées par l'app sur SA db. */
async function stats(): Promise<Record<string, unknown>> {
  const [s] = await query(`SELECT
    (SELECT COUNT(*)::int FROM products) AS products,
    (SELECT COUNT(*)::int FROM products WHERE status = 'active') AS active,
    (SELECT COUNT(*)::int FROM orders) AS orders,
    (SELECT COUNT(*)::int FROM orders WHERE status = 'pending') AS pending`)
  return s
}

// Le dashboard : la route rend la page de l'APP (src/pages/Dashboard.vue).
admin.app.get("/", async (c) => admin.render(c, "Dashboard", { stats: await stats() }))

// Endpoint métier ciblé par l'action « Publier » de la resource products.
admin.app.post("/products/:id/publish", async (c) => {
  const id = c.req.param("id")
  await query(`UPDATE products SET status = 'active' WHERE id = $1`, [id])
  return redirect(`${admin.prefix}/products/${id}`)
})

// Une API JSON qui vit à côté de l'admin (l'app reste une app normale).
admin.app.get("/api/stats", async (c) => c.json(await stats()))

// Démo d'ÉLÉVATION : endpoint sensible protégé par l'extension OTP — le front
// (Dashboard) passe par ensureElevated() avant de l'appeler.
admin.app.post("/demo/sensitive", otp.requireElevation(), (c) => c.json({ done: true }))

const PORT = Number(Deno.env.get("PORT") ?? 8083)
console.log(`Forge dev → http://localhost:${PORT}`)
Deno.serve({ port: PORT }, admin.fetch)
