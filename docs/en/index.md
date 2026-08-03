---
layout: home

hero:
  name: "Forge"
  text: "The plug-and-play admin for Deno"
  tagline: Declare your resources — Forge generates the complete SSR back-office. Lists, detail views, forms, relations, RBAC. Deno Deploy ready.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: The forge() facade
      link: /guide/facade

features:
  - icon: ⚡
    title: Declarative
    details: defineResource(…) and the full CRUD exists — search, faceted filters, sorting, pagination, relations, soft-delete, business hooks.
  - icon: 🧩
    title: Agnostic by contract
    details: Data (ForgeAdapter), auth (permissions), rendering — everything is injected. Postgres ships built-in; other stores implement the same interface.
  - icon: 🖥️
    title: SSR with Inertia + Vue
    details: Server-rendered pages via inertia-deno, a composable Vue kit — primitives, registrable inputs/displays, native i18n.
  - icon: 🚀
    title: Deno Deploy ready
    details: forge() wires everything, production mode serves built assets, Postgres driver from a URL — then Deno.serve(admin.fetch).
  - icon: 🔐
    title: End-to-end RBAC
    details: Per-resource policy, per-field permissions locked in the form AND rejected server-side, CSRF guard on by default.
  - icon: 🎛️
    title: Escape hatches everywhere
    details: Injected layout, custom display/input components, actions wired to your endpoints, full context override.
---
