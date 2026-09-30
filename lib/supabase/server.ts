import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getRole, type Role } from "../roles";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client avec la clé service : contourne la RLS, à n'utiliser qu'après contrôle des droits.
export function createAdminClient() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Utilisateur de la requête : jeton « Bearer » s'il est fourni, sinon cookies de session.
// getUser() fait valider le jeton par Supabase, contrairement à getSession().
export async function getRequestUser(req: Request): Promise<User | null> {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (token) {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await client.auth.getUser(token);
    return error ? null : data.user;
  }

  const cookieStore = await cookies();
  const client = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  });
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}

// Refuse les requêtes d'écriture venant d'une autre origine (protection CSRF).
function isCrossOrigin(req: Request): boolean {
  if (req.method === "GET" || req.method === "HEAD") return false;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  return new URL(origin).host !== new URL(req.url).host;
}

type Guard = { user: User; role: Role } | { response: NextResponse };

// Vérifie que l'appelant a le rôle demandé ; un admin a aussi les droits d'adhérent.
export async function requireRole(req: Request, required: "admin" | "adherent"): Promise<Guard> {
  if (isCrossOrigin(req)) {
    return { response: NextResponse.json({ error: "Origine non autorisée" }, { status: 403 }) };
  }
  const user = await getRequestUser(req);
  if (!user) {
    return { response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  const role = getRole(user);
  const allowed = required === "admin" ? role === "admin" : role === "admin" || role === "adherent";
  if (!allowed) {
    return { response: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
  }
  return { user, role };
}
