// Données FICTIVES pour le développement local uniquement (NEXT_PUBLIC_DONNEES_DEMO=1).
// Elles permettent de voir les pages remplies quand Supabase ou Google Agenda sont
// indisponibles. La variable n'est jamais définie en production : ce code y est éliminé.
import type { AgendaEvent, Outing } from "./agenda";

export const DEMO = process.env.NEXT_PUBLIC_DONNEES_DEMO === "1";

const inDays = (days: number, hour: number, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const demoEvents: AgendaEvent[] = [
  { id: "d1", title: "Sortie cani-marche (exemple)", start: inDays(4, 9, 30), end: inDays(4, 11), location: "Forêt de Vernon", details: "", isPrivate: false },
  { id: "d2", title: "Entraînement cani-cross (exemple)", start: inDays(8, 18, 30), end: inDays(8, 20), location: "Bois de la Garenne", details: "", isPrivate: true },
  { id: "d3", title: "Course départementale (exemple)", start: inDays(15, 10), end: inDays(15, 13), location: "Évreux", details: "", isPrivate: false },
  { id: "d4", title: "Sortie cani-VTT (exemple)", start: inDays(22, 9), end: inDays(22, 11), location: "Les Andelys", details: "", isPrivate: false },
  { id: "d5", title: "Assemblée du club (exemple)", start: inDays(33, 19), end: inDays(33, 21), location: "Vernon", details: "", isPrivate: true },
  { id: "d6", title: "Trail de fin de saison (exemple)", start: inDays(41, 9, 30), end: inDays(41, 12), location: "Vallée de l'Eure", details: "", isPrivate: false },
];

export const demoOuting: Outing = {
  id: "demo-sortie",
  name: "Boucle des coteaux (exemple)",
  sport: "canimarche",
  date_time: inDays(4, 9, 30),
};

export const demoArticles = [
  {
    id: "demo-1",
    titre: "Premiers pas en cani-marche : ce qu'il faut pour venir (exemple)",
    contenu: "Un harnais adapté, une ceinture et une ligne élastique suffisent pour une première sortie. Texte fictif de démonstration.",
    image_url: "/photos/trail.jpg",
    created_at: inDays(-3, 12),
  },
  {
    id: "demo-2",
    titre: "Retour sur la course départementale (exemple)",
    contenu: "Les duos du club étaient au départ. Texte fictif de démonstration pour juger la mise en page.",
    image_url: "/photos/MainPage_bg.jpg",
    created_at: inDays(-12, 12),
  },
  {
    id: "demo-3",
    titre: "Préparer son chien aux sorties d'hiver (exemple)",
    contenu: "Hydratation, échauffement, surveillance des coussinets. Texte fictif de démonstration.",
    image_url: null,
    created_at: inDays(-25, 12),
  },
];

// Boucle fictive autour d'un point, avec un peu de relief
const loop = (lat: number, lon: number, radius: number, points = 48) =>
  Array.from({ length: points + 1 }, (_, i) => {
    const t = (i / points) * Math.PI * 2;
    return [
      lon + Math.cos(t) * radius * 1.5 + Math.sin(t * 3) * radius * 0.2,
      lat + Math.sin(t) * radius,
      60 + Math.round(40 * Math.sin(t * 2) + 20 * Math.cos(t * 5)),
    ] as [number, number, number];
  });

export const demoTracks = [
  { id: "t1", name: "Boucle des coteaux (exemple)", sport: "Marche", date_time: inDays(4, 9, 30), file_url: null, geojson: { coordinates: loop(49.09, 1.49, 0.012) } },
  { id: "t2", name: "Forêt de Vernon, grand tour (exemple)", sport: "Cross", date_time: inDays(11, 9), file_url: null, geojson: { coordinates: loop(49.07, 1.52, 0.02) } },
  { id: "t3", name: "Côte des Andelys (exemple)", sport: "Trail", date_time: inDays(-9, 9), file_url: null, geojson: { coordinates: loop(49.24, 1.41, 0.018) } },
  { id: "t4", name: "Chemin de halage (exemple)", sport: "VTT", date_time: inDays(-20, 10), file_url: null, geojson: null },
];
