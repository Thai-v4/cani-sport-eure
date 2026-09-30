import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAdminClient, requireRole } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUTS = ["en attente", "inscrit", "refusé"] as const;

// Chaîne courte et nettoyée, ou undefined si la valeur n'est pas exploitable
function cleanText(value: unknown, max = 100): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim().slice(0, max);
}

function toAdherent(user: User) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.user_metadata?.first_name || "",
    last_name: user.user_metadata?.last_name || "",
    birthdate: user.user_metadata?.birthdate || "",
    license_number: user.user_metadata?.license_number || "",
    administrateur: user.app_metadata?.administrateur === true,
    animateur: user.app_metadata?.animateur === true,
    comptable: user.app_metadata?.comptable === true,
    statut_inscription: user.app_metadata?.statut_inscription || "en attente",
  };
}

// Liste des adhérents (admin uniquement)
export async function GET(req: Request) {
  const guard = await requireRole(req, "admin");
  if ("response" in guard) return guard.response;

  const supabase = createAdminClient();
  const users: User[] = [];
  // listUsers est paginé : on parcourt toutes les pages
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("Liste des utilisateurs impossible :", error.message);
      return NextResponse.json({ error: "Erreur lors de la récupération des utilisateurs." }, { status: 500 });
    }
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }

  return NextResponse.json(users.map(toAdherent));
}

// Mise à jour d'un adhérent (admin uniquement)
export async function PUT(req: Request) {
  const guard = await requireRole(req, "admin");
  if ("response" in guard) return guard.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !UUID.test(body.id)) {
    return NextResponse.json({ error: "Identifiant d'utilisateur invalide." }, { status: 400 });
  }
  if (body.email !== undefined && (typeof body.email !== "string" || !EMAIL.test(body.email))) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }
  if (body.statut_inscription !== undefined && !STATUTS.includes(body.statut_inscription)) {
    return NextResponse.json({ error: "Statut d'inscription invalide." }, { status: 400 });
  }
  // Un admin ne peut pas se retirer ses propres droits (évite de verrouiller le club)
  if (body.id === guard.user.id && body.administrateur === false) {
    return NextResponse.json({ error: "Vous ne pouvez pas retirer vos propres droits d'administrateur." }, { status: 400 });
  }

  const appMetadata: Record<string, unknown> = {};
  for (const flag of ["administrateur", "animateur", "comptable"] as const) {
    if (typeof body[flag] === "boolean") appMetadata[flag] = body[flag];
  }
  if (body.statut_inscription !== undefined) appMetadata.statut_inscription = body.statut_inscription;

  const { error } = await createAdminClient().auth.admin.updateUserById(body.id, {
    ...(body.email ? { email: body.email } : {}),
    app_metadata: appMetadata,
    user_metadata: {
      first_name: cleanText(body.first_name),
      last_name: cleanText(body.last_name),
      birthdate: cleanText(body.birthdate, 10),
      license_number: cleanText(body.license_number, 30),
    },
  });

  if (error) {
    console.error("Mise à jour utilisateur impossible :", error.message);
    return NextResponse.json({ error: "Erreur lors de la mise à jour de l'utilisateur." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

// Suppression d'un adhérent (admin uniquement)
export async function DELETE(req: Request) {
  const guard = await requireRole(req, "admin");
  if ("response" in guard) return guard.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !UUID.test(body.id)) {
    return NextResponse.json({ error: "Identifiant d'utilisateur invalide." }, { status: 400 });
  }
  if (body.id === guard.user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 400 });
  }

  const { error } = await createAdminClient().auth.admin.deleteUser(body.id);
  if (error) {
    console.error("Suppression utilisateur impossible :", error.message);
    return NextResponse.json({ error: "Erreur lors de la suppression de l'utilisateur." }, { status: 500 });
  }
  return NextResponse.json({ message: "Utilisateur supprimé avec succès." });
}
