import { createBrowserClient } from "@supabase/ssr";

// Client Supabase unique côté navigateur. La session est stockée dans des cookies,
// ce qui permet au proxy et aux routes API de vérifier les droits côté serveur.
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default supabase;
