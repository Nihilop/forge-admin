// Resource « products » de l'app exemple — le CRUD Forge complet (liste, fiche,
// formulaire) + une relation hasMany (commandes du produit, création scopée) et
// une ACTION MÉTIER (« Publier ») branchée sur un endpoint possédé par l'app
// (dev/server.ts) : Forge rend le bouton, l'app gère la route.

import {
  badge,
  boolean,
  date,
  datetime,
  defineResource,
  json,
  number,
  text,
  textarea,
} from "forge/engine"

export default defineResource({
  name: "products",
  table: "products",
  label: "Produits",
  policy: "catalog",
  search: ["name", "sku"],
  orderBy: `"created_at" DESC`,
  nav: { group: "Catalogue", label: "Produits", icon: "package", order: 1 },
  hasMany: [
    {
      key: "orders",
      label: "Commandes",
      resource: "orders",
      foreignKey: "product_id",
      columns: ["customer", "qty", "status"],
      create: true, // « Nouveau » depuis la fiche produit → FK pré-remplie
    },
  ],
  actions: [
    {
      key: "publish",
      label: "Publier",
      icon: "rocket",
      confirm: "Publier ce produit ?",
      visibleWhen: { field: "status", equals: "draft" },
      href: "/products/:id/publish", // endpoint de l'APP (dev/server.ts)
    },
  ],
  bulkActions: [
    {
      key: "activate",
      label: "Marquer actif",
      icon: "rocket",
      confirm: "Marquer les produits sélectionnés comme actifs ?",
      href: "/products/bulk/activate", // endpoint de l'APP (dev/server.ts)
    },
  ],
  fields: [
    text("name", { label: "Nom", searchable: true, editable: true, required: true }),
    text("sku", { label: "Référence", searchable: true, editable: true }),
    number("price", {
      label: "Prix",
      editable: true,
      min: 0,
      step: 0.01,
      column: "price::float8",
      writeColumn: "price",
    }),
    number("stock", { label: "Stock", editable: true, min: 0, step: 1 }),
    boolean("featured", { label: "Mis en avant", editable: true }),
    badge("status", {
      label: "Statut",
      editable: true,
      options: [
        { value: "draft", label: "Brouillon", tone: "muted" },
        { value: "active", label: "Actif", tone: "success" },
      ],
    }),
    datetime("published_at", { label: "Publié le", editable: true, list: false }),
    textarea("description", { label: "Description", editable: true, list: false, wide: true }),
    json("metadata", { label: "Métadonnées", editable: true, list: false, wide: true }),
    date("created_at", {
      label: "Créé le",
      column: "(EXTRACT(EPOCH FROM created_at) * 1000)::float8",
    }),
  ],
})
