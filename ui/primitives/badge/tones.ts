// Teintes SÉMANTIQUES du badge (statuts) — les mêmes que les champs `badge`
// du CRUD (`options[].tone`). Réutilisables dans les pages custom de l'hôte.

export type BadgeTone = "success" | "warning" | "danger" | "primary" | "muted"

export const badgeToneClasses: Record<BadgeTone, string> = {
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/12 text-destructive",
  primary: "bg-primary/12 text-primary",
  muted: "bg-muted text-muted-foreground",
}
