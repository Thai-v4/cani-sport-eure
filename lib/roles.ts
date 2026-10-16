import type { User } from "@supabase/supabase-js";

export type Role = "admin" | "adherent" | null;

// Les rôles sont lus dans app_metadata, modifiable uniquement avec la clé service.
// user_metadata est réécrivable par l'utilisateur lui-même (supabase.auth.updateUser) :
// il ne doit jamais servir à accorder un droit.
export function getRole(user: User | null | undefined): Role {
  const meta = user?.app_metadata;
  if (meta?.administrateur === true) return "admin";
  if (meta?.statut_inscription === "inscrit") return "adherent";
  return null;
}

export function isComptable(user: User | null | undefined): boolean {
  return getRole(user) === "admin" && user?.app_metadata?.comptable === true;
}
