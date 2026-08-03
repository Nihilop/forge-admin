# Déployer

Une app Forge se déploie comme n'importe quelle app Deno : un process qui sert
`admin.fetch`, des **assets front buildés** servis statiquement, une URL
Postgres en variable d'env. Aucune écriture disque au runtime — compatible
**Deno Deploy**.

## 1. Builder le front

```bash
deno task build     # inertia-deno-cli build → dist/
```

Le build Vite produit `dist/` (JS/CSS hashés + manifest). En mode prod, la
façade sert `/assets/*` depuis ce dossier — **pas de Vite au runtime**.

## 2. Passer en mode prod

```ts
const admin = forge({
  db: Deno.env.get("DATABASE_URL")!,
  permissions: (c) => resolvePermissions(c),   // JAMAIS "open" en prod
  // prod: true — ou laissez l'env PROD_MODE=1 le déclencher
})
Deno.serve(admin.fetch)
```

```bash
PROD_MODE=1 deno run -A main.ts   # test local du build
```

## 3. Deno Deploy

```bash
deployctl deploy --project=mon-admin --entrypoint=main.ts
```

- **`DATABASE_URL`** : configurez-la dans les variables d'env du projet Deploy
  (Neon, Supabase… — le pool intégré est paresseux, le cold start ne paie pas
  de connexion).
- **`PROD_MODE=1`** : idem, dans les env vars Deploy.
- Incluez `dist/` dans le déploiement (il est servi statiquement).

::: warning Checklist prod
- `permissions` : un vrai résolveur — `"open"` est un mode dev (il prévient au
  boot, mais c'est vous qui déployez).
- Cookie de session : `Secure` + `SameSite` (la garde CSRF de Forge est une
  défense **en plus**, pas à la place).
- `prefix` : la même valeur partout si vous la personnalisez (option +
  montage).
:::

## Variables d'environnement usuelles

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | URL Postgres (si `db:` est une chaîne). |
| `PROD_MODE=1` | Active le mode prod de la façade (assets statiques). |
| `PORT` | Le port de `Deno.serve` (si vous le lisez dans votre `main.ts`). |

## Le site de doc

Le site (VitePress) se déploie pareil, en statique pur :

```bash
deno task docs:build
deployctl deploy --project=ma-doc --entrypoint=docs/serve.ts
```
