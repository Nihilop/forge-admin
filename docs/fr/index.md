---
layout: home

hero:
  name: "Forge"
  text: "L'admin plug-and-play pour Deno"
  tagline: Déclare tes resources — Forge génère le back-office SSR complet. Listes, fiches, formulaires, relations, RBAC. Deno Deploy ready.
  actions:
    - theme: brand
      text: Prise en main
      link: /fr/guide/getting-started
    - theme: alt
      text: La façade forge()
      link: /fr/guide/facade

features:
  - icon: ⚡
    title: Déclaratif
    details: defineResource(…) et le CRUD complet existe — recherche, filtres facettés, tri, pagination, relations, soft-delete, hooks métier.
  - icon: 🧩
    title: Agnostique par contrat
    details: Données (ForgeAdapter), auth (permissions), rendu — tout est injecté. Postgres fourni ; autres stockages via la même interface.
  - icon: 🖥️
    title: SSR Inertia + Vue
    details: Pages rendues côté serveur via inertia-deno, kit Vue composable — primitives, inputs/displays enregistrables, i18n natif.
  - icon: 🚀
    title: Deno Deploy ready
    details: forge() assemble tout, mode prod sur assets buildés, driver Postgres par URL — puis Deno.serve(admin.fetch).
  - icon: 🔐
    title: RBAC de bout en bout
    details: Policy par resource, permissions par champ verrouillées au form ET refusées serveur, anti-CSRF actif par défaut.
  - icon: 🎛️
    title: Escape hatches partout
    details: Layout injecté, composants d'affichage/saisie custom, actions branchées sur tes endpoints, override complet du contexte.
---
