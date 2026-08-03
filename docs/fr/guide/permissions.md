# Permissions (RBAC)

Le modèle est volontairement simple : une permission est une **chaîne**, un
opérateur a une **liste de permissions effectives**, et Forge vérifie — il ne
stocke **rien**. D'où viennent les rôles et qui les administre, c'est votre
système (ou le [module auth builtin](auth)).

## Le modèle

| Niveau | Permission vérifiée |
|---|---|
| Lire une resource (liste, fiche) | `${policy}.read` |
| Écrire (create, update, delete) | `${policy}.write` |
| Éditer un champ à `permission` | la permission du champ |
| Tirer une action custom | `action.permission` (défaut : `${policy}.write`) |
| Voir une entrée de menu | la permission dérivée de l'entrée |
| Voir une section `hasMany` | `read` de la resource **enfant** |

Comportements :

- `permissions()` renvoie `null` → **anonyme** → redirection `/login` (la page
  de login est à vous).
- Permission de lecture manquante → redirection `/` (pas de 403 nu).
- Champ à `permission` manquante → affiché **verrouillé** au formulaire *et*
  **ignoré à l'écriture** côté serveur, même si le client le soumet. Cas
  limite couvert : s'il est `required` à la création, l'opérateur reçoit une
  erreur claire au lieu d'une violation NOT NULL cryptique.
- Boutons (create/edit/delete, actions) : masqués sans la permission — et les
  routes de mutation revérifient de toute façon.

## Fournir les permissions

Via la [façade](facade), quatre voies :

```ts
// 1. Un résolveur par requête — LE mode production.
forge({
  db,
  permissions: async (c) => {
    const session = await readSession(c)          // votre auth
    if (!session) return null                     // anonyme → /login
    return await permissionsForRole(session.role) // → ["catalog.read", …]
  },
})

// 2. Une liste statique — service interne, proto.
forge({ db, permissions: ["catalog.read", "catalog.write"] })

// 3. "open" — DEV UNIQUEMENT. Dérive TOUTES les permissions du registre
//    (policies, champs, actions, pages) et le dit bruyamment au boot.
forge({ db, permissions: "open" })

// 4. L'auth builtin — le résolveur est fourni automatiquement, branché
//    sessions + rôles stockés. `permissions` devient optionnel.
forge({ db, auth: true })  // voir Authentification
```

La voie 4 est détaillée dans [Authentification](auth).

Avec le [moteur nu](engine), c'est le champ `permissions(c)` du `ForgeContext` —
même contrat : `Promise<string[] | null>`.

## Granularité par champ

```ts
defineResource({
  name: "customers",
  policy: "customers",
  fields: [
    text("name", { editable: true }),                                  // customers.write suffit
    text("iban", { editable: true, permission: "customers.finance" }), // + permission dédiée
  ],
})
```

Un opérateur qui a `customers.write` mais pas `customers.finance` voit le champ
IBAN **en lecture seule** (mention « réservé ») et le serveur ignore toute
valeur soumise pour ce champ.

## Anti-CSRF

Les mutations passent par une garde same-origin **avant** la vérification de
permission. La façade fournit un défaut (`Sec-Fetch-Site`, puis comparaison
d'`Origin`) ; surchargez-la via `context.sameOrigin`, ou fournissez la vôtre au
moteur nu. Sans garde, seul le `SameSite` de votre cookie de session protège.

## Bonnes pratiques

- **`policy` partout** — c'est obligatoire, et c'est voulu : une resource sans
  policy serait ouverte à tout opérateur authentifié.
- Nommez en `domaine.action` : `catalog.read`, `customers.kyc.write`… Forge ne
  fait aucune hiérarchie implicite — `catalog.write` n'implique **pas**
  `catalog.read` ; accordez les deux.
- Ne comptez jamais sur le masquage front : c'est un confort. La sécurité,
  c'est la revalidation serveur (elle est systématique).
