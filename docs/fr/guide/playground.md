# App exemple (playground)

Le dossier `dev/` du dépôt est une **petite app Deno complète** qui consomme
Forge exactement comme le ferait un dev externe — via l'API publique uniquement.
Elle sert à la fois de **démo du DX**, de **spec vivante** et de **harnais de
dev** (Vite HMR sur le kit `ui/`).

## Lancer

```bash
deno task install   # deps front (une fois)
deno task dev       # Vite HMR (front) + backend Deno
deno task serve     # variante PROD : sert le dist buildé (deno task build avant)
```

- **HMR** : éditez le kit (`ui/*.vue`) → rechargement instantané.
- Le **moteur** (`engine/`, serveur) nécessite un restart (pas de HMR).
- `ADMIN_PREFIX=/back deno task serve` → teste un préfixe custom de bout en bout.

Aucune base à installer : la DB est **PGlite** (un vrai Postgres compilé en
WASM, en mémoire), créée et seedée au premier accès. Le moteur génère du vrai
SQL Postgres — PGlite l'exécute tel quel.

## Ce que l'app démontre

| Feature | Où regarder |
|---|---|
| CRUD complet (recherche, filtres, tri, pagination) | `dev/resources/products.ts` · `orders.ts` |
| `belongsTo` + `hasMany` avec création scopée | `orders.product` ; fiche produit → section « Commandes » |
| Action métier conditionnelle branchée sur un endpoint de l'app | action « Publier » + `POST /products/:id/publish` (`dev/server.ts`) |
| Page custom (dashboard, stat tiles, deep-links filtrés) | `definePage` + `dev/src/pages/Dashboard.vue` |
| API JSON qui coexiste avec l'admin | `GET /api/stats` |
| Menu unifié + icônes custom | `dev/src/DevLayout.vue` + `registerNavIcon` (`main.ts`) |
| La façade `forge()` en conditions réelles | tout `dev/server.ts` (~60 lignes) |

## Ajouter une resource démo

1. Déclarez-la dans `dev/resources/` (voir [Resources](resources)).
2. Créez la table + quelques lignes dans le seed (`dev/db.ts`).
3. Importez-la dans `dev/server.ts` : `import "./resources/ma-resource.ts"`.

Elle apparaît dans la sidebar avec son CRUD complet, en HMR.

## Structure

```
dev/
  server.ts         l'app : forge() + routes métier + dashboard
  db.ts             PGlite embarqué + tables/données démo
  resources/        resources de l'app (products, orders…)
  src/
    main.ts         entrée Inertia (resolver dual + i18n + layout + icônes)
    pages/          pages custom de l'app (Dashboard.vue)
    DevLayout.vue   sidebar de l'app (nav Forge + sélecteur de langue)
```
