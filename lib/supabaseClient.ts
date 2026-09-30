import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Au prérendu (serveur, sans window) aucune requête n'est émise : une configuration
// absente ne doit pas faire échouer le build. Dans le navigateur, l'erreur reste explicite.
if ((!url || !anonKey) && typeof window !== "undefined") {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être définies.");
}

// Client Supabase unique côté navigateur. La session est stockée dans des cookies,
// ce qui permet au proxy et aux routes API de vérifier les droits côté serveur.
const supabase = createBrowserClient(
  url || "http://localhost:54321",
  anonKey || "configuration-absente"
);

export default supabase;
