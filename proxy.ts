import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getRole } from "./lib/roles";

// Pages réservées, vérifiées côté serveur avant tout rendu.
// La RLS Supabase reste la protection des données ; ceci protège l'accès aux écrans.
const ADMIN_PATHS = [
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

const MEMBER_PATHS = [
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

const matches = (pathname: string, paths: string[]) =>
  paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAdmin = matches(pathname, ADMIN_PATHS);
  const needsMember = matches(pathname, MEMBER_PATHS);

  // Pages publiques : aucun appel à Supabase, pas de latence ajoutée
  if (!needsAdmin && !needsMember) return NextResponse.next();

  let response = NextResponse.next({ request });

  // Rafraîchit la session Supabase et réécrit ses cookies si besoin
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // getUser() fait valider le jeton par Supabase (un cookie falsifié est refusé)
  const { data } = await supabase.auth.getUser();
  const role = getRole(data.user);
  const allowed = needsAdmin ? role === "admin" : role === "admin" || role === "adherent";

  if (!allowed) {
    const url = request.nextUrl.clone();
    url.search = "";
    url.pathname = data.user ? "/unauthorized" : "/connexion";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Toutes les pages, sauf fichiers statiques, images optimisées et routes API
  // (les routes API vérifient elles-mêmes les droits)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?)$).*)"],
};
