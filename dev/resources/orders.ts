// Resource démo « orders » — montre un belongsTo (→ products) + un hasMany
// inverse possible. Sert à éprouver relations et fiche dans le harnais dev.

import { badge, belongsTo, date, defineResource, text } from "forge/engine"

export default defineResource({
  name: "orders",
  table: "orders",
  label: "Commandes",
  policy: "catalog",
  search: ["customer"],
  orderBy: `"created_at" DESC`,
  nav: { group: "Catalogue", label: "Commandes", icon: "receipt", order: 2 },
  fields: [
    belongsTo("product", {
      resource: "products",
      column: "product_id",
      labelField: "name",
      label: "Produit",
      editable: true,
    }),
    text("customer", { label: "Client", searchable: true, editable: true, required: true }),
    text("qty", { label: "Quantité", editable: true, column: "qty::text", writeColumn: "qty" }),
    badge("status", {
      label: "Statut",
      editable: true,
      options: [
        { value: "pending", label: "En attente", tone: "warning" },
        { value: "paid", label: "Payée", tone: "success" },
      ],
    }),
    date("created_at", {
      label: "Créée le",
      column: "(EXTRACT(EPOCH FROM created_at) * 1000)::float8",
    }),
  ],
})
