// Pages réservées, partagées entre le proxy (contrôle serveur) et l'interface.
export const ADMIN_PATHS = [
  "/dashboard/admin",
  "/agendaAdmin",
  "/articleAdmin",
  "/resultatAdmin",
  "/DocumentManager",
  "/AlbumManager",
  "/catalogue",
  "/evenements",
  "/tableauAdmin",
];

export const MEMBER_PATHS = [
  "/dashboard/client",
  "/album",
  "/agenda",
  "/resultats",
  "/creation-profil",
  "/creation-chien",
  "/Document",
  "/galerie",
  "/gallery",
];

export const matchesPath = (pathname: string, paths: string[]) =>
  paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
