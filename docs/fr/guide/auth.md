# Authentification

Le module auth **builtin** fournit tout le socle : admins, rôles, sessions,
page de login — stocké dans votre base, tables préfixées `forge_`. Il
s'active via la [façade](facade), et quand il est actif, l'option
`permissions` devient **optionnelle** : le module fournit le résolveur,
branché sur les sessions et les rôles stockés.

```ts
const admin = forge({
  db: Deno.env.get("DATABASE_URL")!,
  auth: {
    seed: {
      email: Deno.env.get("FORGE_ADMIN_EMAIL")!,
      password: Deno.env.get("FORGE_ADMIN_PASSWORD")!,
    },
  },
  title: "Mon back-office",
})
```

`auth: true` fonctionne aussi (toutes les options ont un défaut) — mais sans
`seed`, il faudra créer le premier admin autrement (voir plus bas).

## Les options (`AuthOptions`)

| Option | Défaut | Rôle |
|---|---|---|
| `seed` | — | `{ email, password, name? }` — crée le **premier** admin au boot s'il n'existe aucun admin. |
| `sessionTtlHours` | `168` (7 jours) | Durée de vie d'une session. |
| `cookieName` | `forge_session` | Nom du cookie de session. |

## Le premier admin (`seed`)

Au boot, s'il n'existe **aucun** admin, le `seed` en crée un avec le rôle
« Super admin » (toutes les permissions, automatiquement). S'il existe déjà au
moins un admin, le `seed` est ignoré — il est idempotent, laissez-le en place.

Sans `seed` et sans admin en base, Forge démarre quand même mais l'affiche
**bruyamment** au boot, avec l'instruction pour en créer un (via `seed` ou
`admin.auth.createAdmin(…)`).

::: tip
Passez les identifiants du seed par variables d'environnement, jamais en dur —
c'est un mot de passe de production comme un autre.
:::

## Tables & migrations

Les migrations système tournent automatiquement au boot : **paresseuses**
(déclenchées à la première utilisation), **idempotentes**, et suivies dans
`forge_migrations`. Elles ne touchent **que** des tables préfixées `forge_` —
jamais vos tables métier.

| Table | Contenu |
|---|---|
| `forge_roles` | `name` (unique), `permissions` (JSON array de chaînes). |
| `forge_admins` | `email` (unique), `name`, `password_hash` (PBKDF2-SHA256, 210 000 itérations, WebCrypto), `role_id` (FK), `totp_secret` / `totp_enabled`, `disabled_at`, `created_at`. |
| `forge_sessions` | `token_hash` — la DB ne stocke que le SHA-256 du jeton — `admin_id`, `expires_at`, `elevated_until`. |

Deux colonnes préparent le terrain pour la suite : `totp_*` est un socle 2FA
**générique** (prêt pour l'extension OTP), et `elevated_until` porte
l'**élévation** de session (confirmation d'actions sensibles).

::: warning Multi-dialectes
Chaque étape de migration porte ses variantes par dialecte : Postgres est
supporté aujourd'hui, MySQL/MariaDB/MongoDB sont prévus avec leurs adapters.
Le module nécessite un adapter qui expose `raw` — l'adapter Postgres intégré
le fait.
:::

## Les routes installées

- `GET /login` et `POST /login` — page `forge/Login` du kit, formulaire
  email + mot de passe. En cas d'échec : « Identifiants invalides. », en
  **temps constant** (anti-énumération : impossible de deviner si l'email
  existe).
- `POST /logout` — détruit la session.

Le cookie de session est `HttpOnly` + `SameSite=Lax` (+ `Secure` en https).
Le moteur redirige déjà les anonymes vers `/login` — rien d'autre à brancher.

## Le menu « Administration »

Le module s'installe avec les briques de Forge elle-mêmes (dogfooding) : une
resource et une page custom, regroupées dans un menu « Administration ».

### Resource Admins (`<prefix>/forge-admins`)

Liste, fiche et édition des admins : nom, rôle (via `belongsTo`), badges 2FA
et Statut (actif / désactivé). Création et suppression sont **désactivées**
par le CRUD, à dessein :

- **Créer** : via `seed` ou `admin.auth.createAdmin(…)`.
- **Retirer** : on ne supprime pas un admin, on le **désactive**
  (`disabled_at`) — l'historique reste attribuable.

### Rôles & permissions (`<prefix>/system/roles`)

Édition des rôles, avec un catalogue de permissions **dynamique** : il est
dérivé du registre à **chaque requête** — policies `*.read`/`*.write` des
resources, permissions de champs, d'actions, de pages custom. Déclarez une
nouvelle permission n'importe où dans l'app : elle apparaît dans le catalogue
sans rien synchroniser.

- Le toggle « Toutes les permissions » stocke la permission spéciale `"*"`,
  étendue au catalogue complet à l'exécution — un rôle `"*"` couvre donc
  aussi les permissions futures.
- Supprimer un rôle : les admins de ce rôle perdent leur rôle (donc leurs
  permissions), sans être supprimés. Le rôle **Super admin** est
  indestructible.

### Profil (`<prefix>/system/profile`)

Le compte de l'admin **connecté** — accessible à tout admin, sans permission
particulière :

- **Identité** : email (lecture seule) et nom affiché, modifiable.
- **Mot de passe** : changement protégé — le mot de passe **actuel** est
  exigé et vérifié, le nouveau doit faire 8 caractères minimum.

La page expose l'outlet **`profile:sections`** : les extensions y ajoutent
leurs propres sections. L'[extension OTP](otp) s'en sert pour afficher sa
carte « Sécurité (2FA) » (état d'enrôlement + accès à la gestion) — vos
extensions peuvent faire pareil, voir [Outlets](outlets).

## L'API `admin.auth`

`forge({ auth })` expose l'API sur le retour (`admin.auth`, type `AuthApi`) :

| Méthode | Rôle |
|---|---|
| `permissions(c)` | Le résolveur de permissions (celui branché par défaut). |
| `currentAdmin(c)` | L'admin de la session courante, ou `null`. |
| `createAdmin({ email, password, name?, roleId? })` | Crée un admin par code (script d'onboarding, CLI…). |
| `elevate(c, minutes)` / `isElevated(c)` | Marque / vérifie une session **élevée** — socle de la confirmation d'actions sensibles. |
| `ready` | Promesse d'init (migrations + seed) — utile en test. |

```ts
// Exemple : une route métier qui exige une session élevée
admin.app.post("/api/danger", async (c) => {
  if (!await admin.auth.isElevated(c)) return c.json({ error: "elevate" }, 403)
  // …
})
```

## Sécurité

- **Mots de passe** : PBKDF2-SHA256, 210 000 itérations, via WebCrypto — zéro
  dépendance, compatible Deno Deploy.
- **Sessions** : le jeton n'est **jamais** stocké en clair — la DB ne connaît
  que son SHA-256. Un dump de la table ne permet pas de rejouer une session.
- **Anti-CSRF** : la garde same-origin de la façade est active sur login,
  logout et l'édition des rôles.
- **Login à temps constant** : même durée de réponse que l'email existe ou
  non.

::: tip Élévation & OTP
`elevate` / `isElevated` et les colonnes `totp_*` sont le socle de
l'**extension OTP**, fournie avec la lib : 2FA TOTP au login et confirmation
par code des actions sensibles (élévation temporaire de session). Elle est
désactivée par défaut — voir [2FA & élévation (extension OTP)](otp) pour
l'activer.
:::
