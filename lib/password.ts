// Règles de mot de passe, partagées par les formulaires et l'API d'inscription
export const PASSWORD_RULES = [
  { id: "longueur", label: "12 caractères minimum", test: (p: string) => p.length >= 12 },
  { id: "majuscule", label: "Une majuscule", test: (p: string) => /[A-Z]/.test(p) },
  { id: "minuscule", label: "Une minuscule", test: (p: string) => /[a-z]/.test(p) },
  { id: "chiffre", label: "Un chiffre", test: (p: string) => /[0-9]/.test(p) },
  { id: "special", label: "Un caractère spécial (! ? @ # …)", test: (p: string) => /[^A-Za-z0-9\s]/.test(p) },
  { id: "espace", label: "Aucun espace", test: (p: string) => p.length > 0 && !/\s/.test(p) },
] as const;

export function passwordError(password: string): string | null {
  if (password.length > 128) return "Le mot de passe ne doit pas dépasser 128 caractères.";
  const failed = PASSWORD_RULES.find((rule) => !rule.test(password));
  return failed ? `Mot de passe trop faible : ${failed.label.toLowerCase()}.` : null;
}
