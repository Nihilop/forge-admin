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
      export: "Exporter en CSV",
      selected: "{n} sélectionné(s)",
      selectAll: "Tout sélectionner",
      clear: "Effacer la sélection",
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
    boolean: {
      yes: "Oui",
      no: "Non",
    },
    widgets: {
      title: "Tableau de bord",
      error: "Impossible de charger ce widget.",
    },
    confirm: {
      delete: "Supprimer cet élément ?",
      deleteMany: "Supprimer {n} élément(s) ?",
      cancel: "Annuler",
      confirm: "Confirmer",
    },
    otp: {
      title: "Sécurité (2FA)",
      stateEnabled: "Activée",
      stateDisabled: "Désactivée",
      setupIntro:
        "Protégez votre compte avec une application d'authentification (Google Authenticator, Aegis…).",
      generate: "Générer un secret",
      enrollHint: "Ajoutez ce secret dans votre application, puis confirmez avec un code.",
      uriLabel: "URI d'enrollment (compatible QR)",
      secretLabel: "Clé (saisie manuelle)",
      codeLabel: "Code à 6 chiffres",
      enable: "Activer",
      disable: "Désactiver",
      enabledHint: "La double authentification est active. Saisissez un code pour la désactiver.",
      invalid: "Code invalide.",
      challengeTitle: "Vérification en deux étapes",
      challengeHint: "Saisissez le code de votre application d'authentification.",
      verify: "Vérifier",
      elevateTitle: "Confirmation requise",
      elevateHint: "Cette action sensible demande un code de votre application d'authentification.",
    },
    profile: {
      title: "Profil",
      identity: "Identité",
      name: "Nom affiché",
      password: "Mot de passe",
      currentPassword: "Mot de passe actuel",
      newPassword: "Nouveau mot de passe",
      changePassword: "Changer le mot de passe",
      manage: "Gérer",
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
