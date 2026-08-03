# 2FA & élévation (extension OTP)

L'extension OTP est la **première extension officielle** de Forge : elle
apporte la **2FA TOTP** (compatible Google Authenticator, Aegis, 1Password…),
le **challenge au login** et l'**élévation de session** — la confirmation par
code des actions que *vous* jugez sensibles. Elle se branche sur le socle déjà
posé par l'[auth builtin](auth) (colonnes `totp_*`, `elevate`/`isElevated`).

::: tip Fournie, mais désactivée par défaut
L'extension est livrée **avec** la lib, mais ne s'active jamais toute seule —
l'activer est un opt-in explicite, en deux moitiés (serveur + front). C'est le
**modèle des futures extensions communautaires** : un module serveur passé à
`extensions: […]`, un module UI passé à `installForgeExtensions`.
:::

## Activer l'extension

Deux moitiés, une par côté. Le serveur nécessite l'auth builtin
(`forge({ auth })`).

**Serveur** (`main.ts`) :

```ts
import { otpApiOf, otpServer } from "@streemkit/forge/extensions/otp"

const admin = forge({
  db,
  auth: { seed },
  extensions: [otpServer({ issuer: "MonApp" })],
})
```

**Front** (`src/main.ts`) :

```ts
import { otpUi } from "@forge/extensions/otp"

installForgeExtensions(app, [otpUi()], { i18n })
```

C'est tout : la carte « Sécurité (2FA) » apparaît sur la page
[Profil](auth#profil-prefix-system-profile) (via l'outlet
[`profile:sections`](outlets)), le challenge s'intercale au login des admins
2FA, et le dialog d'élévation est monté (via l'outlet [`overlays`](outlets)
du shell).

## Les options (`OtpOptions`)

| Option | Défaut | Rôle |
|---|---|---|
| `issuer` | `"Forge"` | Nom de l'émetteur affiché dans l'app d'authentification. |
| `elevationMinutes` | `10` | Durée d'une élévation de session (minutes). |
| `strict` | `false` | `true` → `requireElevation` **bloque** les admins sans 2FA enrôlée (voir [élévation](#lelevation-marquer-une-action-sensible)). |

## Ce que vivent les admins

### Enrôlement — page « Sécurité (2FA) »

Chaque admin gère **sa** 2FA, sur `<prefix>/system/otp` — le bouton
« Gérer » de la carte 2FA de sa page Profil y mène :

1. **Générer un secret** — la page affiche l'URI `otpauth://` (compatible QR)
   et la clé en clair pour la saisie manuelle.
2. **L'ajouter dans son app** d'authentification (Google Authenticator,
   Aegis, 1Password…).
3. **Confirmer un code** à 6 chiffres — c'est cette confirmation qui
   **active** la 2FA. Tant qu'elle n'a pas eu lieu, rien ne change au login.

La **désactivation** est protégée de la même façon : elle exige un code
valide.

### Challenge au login

Quand la 2FA d'un admin est active, le mot de passe seul ne suffit plus :
après l'étape email + mot de passe, une page « code à 6 chiffres » s'intercale
**avant** la création de session. Le challenge est éphémère (5 minutes) — au
delà, retour au login.

## L'élévation : marquer une action sensible

C'est la fonctionnalité clé pour vous, dev : exiger une **confirmation OTP
récente** avant une action dangereuse (suppression en masse, rotation de
clés, remboursement…). Une session reste **élevée** `elevationMinutes`
minutes après une confirmation — pas de re-saisie à chaque clic.

### Côté serveur

`otpApiOf(admin)` expose le middleware `requireElevation()` :

```ts
const otp = otpApiOf(admin)

admin.app.post("/danger", otp.requireElevation(), (c) => {
  // On n'arrive ici qu'avec une session élevée.
  return c.json({ done: true })
})
```

Sans session élevée, la route répond un **403 typé**
`{ forge: "elevation-required" }` — c'est ce marqueur que le front
intercepte.

### Côté front

`ensureElevated(prefix)` garantit une session élevée : déjà élevée → résout
tout de suite ; sinon, ouvre le dialog OTP partagé (monté par `otpUi()`),
vérifie le code, résout.

```ts
import { ensureElevated } from "@forge/extensions/otp"

async function onDanger() {
  if (await ensureElevated(prefix)) {
    // …appel de l'action sensible…
  }
}
```

Elle résout `true` si l'élévation est acquise, `false` si l'admin annule le
dialog.

### Mode souple vs `strict`

Par défaut (**souple**), un admin **sans** 2FA enrôlée n'est pas bloqué :
l'élévation est inapplicable, donc accordée — l'extension s'active sans
casser le flux de personne. Avec `strict: true`, `requireElevation` exige
l'enrollment : pas de 2FA, pas d'action sensible.

## Migrations

L'extension apporte ses **propres** migrations (challenges de login,
anti-replay) : automatiques au boot, idempotentes, suivies dans
`forge_migrations` comme celles de l'auth. Elle s'appuie sur les colonnes
`totp_*` déjà prévues par le [module auth](auth#tables-migrations) — rien à
faire de votre côté.

## Sécurité

- **TOTP RFC 6238**, 100 % WebCrypto — zéro dépendance, compatible Deno
  Deploy. Les défauts de l'écosystème (6 chiffres, pas de 30 s), avec une
  fenêtre de tolérance d'horloge de ±30 s.
- **Anti-replay** : un code ne sert qu'**une** fois — le dernier compteur
  accepté est persisté par admin.
- **Challenge éphémère** : le challenge de login expire au bout de 5 minutes
  et est détruit après usage.
- **Désactivation protégée** : couper sa 2FA exige un code valide.

::: tip Envie de voir tourner le tout ?
L'[app exemple](playground) active l'extension : carte 2FA sur la page
Profil, démo « action sensible » sur le dashboard.
:::
