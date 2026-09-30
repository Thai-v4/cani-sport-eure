// Disciplines du club : libellés, niveau et description
export const DISCIPLINES = [
  {
    key: "canicross",
    label: "Cani-cross",
    level: "Tous niveaux",
    text: "Le coureur et son chien forment une équipe, reliés par une ceinture et une ligne élastique, sur 5 à 9 km.",
  },
  {
    key: "canitrail",
    label: "Cani-trail",
    level: "Plus exigeant",
    text: "Le canicross sur terrains vallonnés et techniques : résistance et agilité du duo.",
  },
  {
    key: "canimarche",
    label: "Cani-marche",
    level: "Accessible à tous",
    text: "Une activité douce pour explorer la nature avec son chien, sans contrainte de vitesse.",
  },
  {
    key: "canivtt",
    label: "Cani-VTT",
    level: "Intense",
    text: "Le chien court en tête, relié au VTT par une ligne amortie. Coordination et entraînement adapté.",
  },
  {
    key: "canitrottinette",
    label: "Cani-trottinette",
    level: "Intense",
    text: "Une trottinette tout-terrain tractée par le chien, idéale pour les chiens dynamiques.",
  },
] as const;

const LABELS: Record<string, string> = {
  canicross: "Cani-cross",
  canitrail: "Cani-trail",
  canimarche: "Cani-marche",
  canivtt: "Cani-VTT",
  canitrottinette: "Cani-trottinette",
  trottinette: "Cani-trottinette",
  cross: "Cani-cross",
  trail: "Cani-trail",
  marche: "Cani-marche",
  vtt: "Cani-VTT",
  balade: "Balade",
};

// « canicross », « Cani-Cross », « cross »… → « Cani-cross »
export function sportLabel(value?: string | null): string {
  if (!value) return "Sortie";
  const key = value.toLowerCase().replace(/[\s_-]/g, "");
  return LABELS[key] ?? value;
}
