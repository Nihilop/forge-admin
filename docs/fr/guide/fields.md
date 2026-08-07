# Champs

Un champ décrit **une colonne** : comment l'afficher (liste + fiche) et comment
la saisir (formulaire). On les crée avec des helpers typés.

## Les helpers

| Helper | Usage |
|---|---|
| `text(key, opts?)` | Texte court (libellés, références…). |
| `textarea(key, opts?)` | Texte long — textarea au formulaire (pensez `wide: true`). |
| `email(key, opts?)` | Email — validation au formulaire. |
| `number(key, opts?)` | Nombre — coercé et validé serveur (`min` / `max` / `step`). |
| `boolean(key, opts?)` | Booléen — Switch au formulaire, badge Oui/Non en liste. |
| `select(key, opts?)` | Liste déroulante (`options`). |
| `badge(key, opts?)` | Enum colorée (`options` + `tone`) — filtrable en liste. |
| `date(key, opts?)` | Date seule — le front formate (envoyez un epoch ms). |
| `datetime(key, opts?)` | Date + heure — input natif, écrit en ISO-8601 (UTC). |
| `json(key, opts?)` | JSON — éditeur monospace, parse validé serveur, affichage pretty. |
| `belongsTo(key, { … })` | Clé étrangère vers une autre resource. |

Par défaut un champ est **visible en liste** et **non éditable** — vous
choisissez explicitement ce qui est modifiable.

## Options communes

| Option | Rôle |
|---|---|
| `label` | Libellé. Défaut : la clé humanisée. |
| `column` | **Expression d'affichage** (code-defined, jamais d'entrée utilisateur). Défaut : la clé. |
| `writeColumn` | Colonne d'**écriture** si différente de l'affichage. |
| `list` | Visible dans la liste. Défaut : `true` (`false` = fiche seulement). |
| `wide` | Fiche + form : pleine largeur (contenus longs). |
| `searchable` | Inclus dans la recherche plein-texte. |
| `editable` | Éditable au formulaire. Défaut : `false`. |
| `required` | Requis à la saisie (validé serveur). |
| `options` | `[{ value, label, tone? }]` pour `select` / `badge`. La valeur soumise est **validée contre les options** côté serveur. |
| `permission` | Permission requise pour **éditer** ce champ — voir [Permissions](permissions). |
| `display` / `input` | Composant custom enregistré — voir [Kit frontend](frontend). |
| `min` / `max` / `step` | Bornes et pas d'un champ `number` — `min`/`max` sont validés au formulaire **et** côté serveur. |

## Exemples

**Badge avec teintes** (`tone` : `success` · `warning` · `danger` · `primary` ·
`muted`). Tout champ à options devient automatiquement un **filtre facetté**
dans la liste :

```ts
badge("status", {
  label: "Statut",
  editable: true,
  options: [
    { value: "draft", label: "Brouillon", tone: "muted" },
    { value: "active", label: "Actif", tone: "success" },
  ],
})
```

**Date via expression** — le moteur envoie un epoch ms, le front formate selon
la locale :

```ts
date("created_at", {
  label: "Créé le",
  column: "(EXTRACT(EPOCH FROM created_at) * 1000)::float8",
})
```

**Colonne calculée** (sous-requête d'affichage) :

```ts
badge("kyc", {
  label: "KYC",
  column: `(SELECT status FROM kyc_verifications
            WHERE person_id = persons.id
            ORDER BY created_at DESC LIMIT 1)`,
  options: [/* … */],
})
```

::: warning `column` est du code, pas de la donnée
Les expressions `column` / `writeColumn` / `orderBy` sont écrites par **vous**
dans le code et interprétées par l'[adapter](engine) (du SQL pour Postgres).
N'y injectez jamais une valeur d'entrée utilisateur — les *valeurs*, elles,
passent toujours par des paramètres liés.
:::

**Nombre borné** — la valeur est coercée (chaîne → nombre, virgule acceptée)
et les bornes sont revalidées côté serveur :

```ts
number("price", {
  label: "Prix",
  editable: true,
  min: 0,
  step: 0.01,
  column: "price::float8", // NUMERIC arrive en chaîne : castez pour l'affichage
  writeColumn: "price",
})
```

**Booléen, date+heure, JSON** — la coercion serveur normalise ce que le
navigateur envoie (chaînes) avant l'adapter :

```ts
boolean("featured", { label: "Mis en avant", editable: true }),
datetime("published_at", { label: "Publié le", editable: true, list: false }),
json("metadata", { label: "Métadonnées", editable: true, list: false, wide: true }),
```

- `boolean` : Switch au formulaire, badge **Oui/Non** en liste et fiche.
- `datetime` : input `datetime-local` (heure locale), écrit en **ISO-8601
  UTC** — une colonne `TIMESTAMPTZ` l'accepte telle quelle.
- `json` : la saisie est **parse-validée** (« JSON invalide. » sinon) et
  écrite normalisée — une colonne `json`/`jsonb` la caste nativement.
  L'affichage est pretty-printé (pensez `wide: true`).

**Écriture ≠ affichage** — afficher une expression, écrire la colonne brute
(`column` = affichage, `writeColumn` = écriture, comme sur `price` ci-dessus).

**Relation `belongsTo`** :

```ts
belongsTo("product", {
  resource: "products",   // la resource cible (déclarée)
  column: "product_id",   // la FK dans CETTE table
  labelField: "name",     // champ affiché de la cible
  label: "Produit",
  editable: true,         // → menu déroulant des cibles au formulaire
})
```

Ce que vous obtenez : en liste et fiche, un **lien cliquable** vers la cible
(`{ id, label }` résolu par le moteur) ; au formulaire, un select alimenté par
les enregistrements cibles (les soft-supprimés exclus) ; le tri sur la colonne
trie par **libellé** de la cible.

**Champ pleine largeur** (bio, description, markdown…) :

```ts
text("body", { label: "Contenu", wide: true, editable: true, list: false })
```

**Champ gated par permission** — verrouillé au form **et** refusé serveur :

```ts
text("legal_name", { label: "Nom légal", editable: true, permission: "customers.kyc.write" })
```

## Affichage / saisie custom

Quand un helper ne suffit pas, référencez un composant **enregistré** côté
front — le reste du champ (colonne, permission, list…) continue de fonctionner :

```ts
text("body", { display: "markdown", input: "markdown", wide: true, editable: true })
```

L'enregistrement (`registerDisplay` / `registerInput`) est décrit dans
[Kit frontend](frontend). Le kit fournit déjà `markdown` (éditeur + rendu).
