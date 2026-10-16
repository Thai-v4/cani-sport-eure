import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { passwordError as validatePassword } from "@/lib/password";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


// Limitation simple par adresse IP (par instance serveur) contre les inscriptions en rafale
const attempts = new Map<string, { count: number; since: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.since > WINDOW_MS) {
    attempts.set(ip, { count: 1, since: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

// Inscription : crée le compte (statut « en attente ») puis le profil associé
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnue";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const firstName = typeof body?.first_name === "string" ? body.first_name.trim().slice(0, 100) : "";
  const lastName = typeof body?.last_name === "string" ? body.last_name.trim().slice(0, 100) : "";

  if (!email || !password || !firstName || !lastName) {
    return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
  }
  if (!EMAIL.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }
  const weakPassword = validatePassword(password);
  if (weakPassword) {
    return NextResponse.json({ error: weakPassword }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Les droits vont dans app_metadata (non modifiable par l'utilisateur) ;
  // le compte reste « en attente » jusqu'à validation par le bureau.
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
    app_metadata: { administrateur: false, statut_inscription: "en attente" },
  });

  if (error || !data.user) {
    const alreadyUsed = error?.message?.toLowerCase().includes("already");
    return NextResponse.json(
      { error: alreadyUsed ? "Cet email est déjà utilisé." : "Erreur lors de l'inscription." },
      { status: alreadyUsed ? 409 : 500 }
    );
  }

  const { error: profileError } = await supabase.from("profils").insert({
    id: data.user.id,
    created_at: new Date().toISOString(),
    nom: lastName,
    prenom: firstName,
    email,
  });

  if (profileError) {
    console.error("Création du profil impossible :", profileError.message);
    // Pas de compte orphelin sans profil
    await supabase.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ error: "Erreur lors de l'ajout du profil." }, { status: 500 });
  }

  return NextResponse.json({ message: "Inscription réussie !" });
}
