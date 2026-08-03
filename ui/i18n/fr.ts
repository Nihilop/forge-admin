// Messages de base de Forge — français. Namespace `FORGE_I18N_NS.*` (jamais de
// collision avec les messages de l'app hôte). L'hôte peut surcharger ces clés.

import { FORGE_I18N_NS } from "../brand"

export default {
  [FORGE_I18N_NS]: {
    actions: {
      new: "Nouveau",
      edit: "Modifier",
      delete: "Supprimer",
      create: "Créer",
      save: "Enregistrer",
      more: "Plus",
      label: "Actions",
      view: "Voir",
    },
    index: {
      search: "Rechercher…",
      columns: "Colonnes",
      filterAll: "tous",
      count: "{n} élément(s)",
      empty: "Aucun élément.",
      range: "{from}–{to} sur {total}",
      rangeEmpty: "0 élément",
      perPage: "{n} / page",
      prev: "Précédent",
      next: "Suivant",
    },
    form: {
      titleCreate: "Nouveau — {label}",
      titleEdit: "Modifier — {label} #{id}",
      back: "Retour",
      linkedTo: "Lié à {label}",
      locked: "(réservé)",
    },
    show: {
      empty: "Aucun.",
    },
    confirm: {
      delete: "Supprimer cet élément ?",
      cancel: "Annuler",
      confirm: "Confirmer",
    },
    auth: {
      subtitle: "Connectez-vous pour continuer",
      email: "Email",
      password: "Mot de passe",
      submit: "Se connecter",
    },
    roles: {
      title: "Rôles & permissions",
      description:
        "Les permissions se déduisent de vos resources, champs, actions et pages — cette page s'adapte automatiquement.",
      placeholder: "Nom du rôle…",
      create: "Créer",
      save: "Enregistrer",
      deleteConfirm: "Supprimer ce rôle ?",
      allPerms: "Toutes les permissions",
      unknown: "Permissions inconnues",
    },
  },
}
