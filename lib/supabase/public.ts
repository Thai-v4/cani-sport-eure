import "server-only";
import { createClient } from "@supabase/supabase-js";

// Client serveur anonyme pour les contenus publics (articles, sorties) :
// aucune session, seules les règles RLS publiques s'appliquent.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "configuration-absente",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
