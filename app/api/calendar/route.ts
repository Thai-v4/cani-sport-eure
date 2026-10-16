import { auth, calendar as googleCalendar, type calendar_v3 } from "@googleapis/calendar";
import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, requireRole } from "@/lib/supabase/server";
import { getRole } from "@/lib/roles";

// ─── Google Calendar (compte de service), initialisé à la première requête ───
let calendarClient: calendar_v3.Calendar | null = null;
function getCalendar() {
  if (!calendarClient) {
    const jwt = new auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });
    calendarClient = googleCalendar({ version: "v3", auth: jwt });
  }
  return calendarClient;
}
const CALENDAR_ID = () => process.env.GOOGLE_CALENDAR_ID!;

const DEFAULT_COLOR = "#3b82f6";
const HEX_COLOR = /^#[0-9a-f]{3,8}$/i;
const EVENT_ID = /^[a-zA-Z0-9_-]{1,1024}$/;

// La description Google stocke « couleur::visibilité::détails »
function parseColorVisibility(description = "") {
  const [color, visibility, ...rest] = description.split("::");
  return {
    color: HEX_COLOR.test(color ?? "") ? color : DEFAULT_COLOR,
    visibility: visibility === "private" ? "private" : "public",
    details: rest.join("::"),
  };
}

type EventInput = {
  summary: string;
  location: string;
  description: string;
  start: string;
  end: string;
};

// Valide le corps envoyé par les formulaires d'agenda (formats historiques compris)
function parseEventInput(body: any): EventInput | string {
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title || title.length > 200) return "Titre manquant ou trop long.";

  const start = new Date(body.start);
  const end = new Date(body.end ?? body.start);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Dates invalides.";
  if (end < start) return "La fin de l'événement précède son début.";

  // Le champ « color » peut contenir la chaîne complète ou seulement la couleur
  const parsed = parseColorVisibility(typeof body.color === "string" ? body.color : "");
  const visibility = body.visibility === "private" || body.visibility === "public" ? body.visibility : parsed.visibility;
  const rawDetails = typeof body.description === "string" ? body.description : parsed.details;
  const details = rawDetails.replaceAll("::", ":").slice(0, 5000);
  const location = typeof body.location === "string" ? body.location.slice(0, 300) : "";

  return {
    summary: title,
    location,
    description: `${parsed.color}::${visibility}::${details}`,
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

// ─── GET : événements à venir ; les privés sont réservés aux adhérents validés ───
export async function GET(req: NextRequest) {
  try {
    const role = getRole(await getRequestUser(req));
    const canSeePrivate = role === "admin" || role === "adherent";

    const response = await getCalendar().events.list({
      calendarId: CALENDAR_ID(),
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (response.data.items || [])
      .map((event) => ({ event, meta: parseColorVisibility(event.description || "") }))
      .filter(({ meta }) => meta.visibility === "public" || canSeePrivate)
      .map(({ event, meta }) => {
        const start = event.start?.dateTime || (event.start?.date ? new Date(event.start.date + "T00:00:00").toISOString() : null);
        const end = event.end?.dateTime || (event.end?.date ? new Date(new Date(event.end.date).getTime() - 1).toISOString() : null);
        return {
          id: event.id,
          summary: event.summary,
          description: `${meta.color}::${meta.visibility}::${meta.details}`,
          start: { dateTime: start },
          end: { dateTime: end },
          location: event.location || "",
        };
      });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Erreur API Google Calendar :", error);
    return NextResponse.json({ error: "Impossible de récupérer les événements" }, { status: 500 });
  }
}

// ─── POST : créer un événement (admin) ───
export async function POST(req: NextRequest) {
  const guard = await requireRole(req, "admin");
  if ("response" in guard) return guard.response;

  const input = parseEventInput(await req.json().catch(() => null));
  if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });

  try {
    const response = await getCalendar().events.insert({
      calendarId: CALENDAR_ID(),
      requestBody: {
        summary: input.summary,
        location: input.location,
        description: input.description,
        start: { dateTime: input.start, timeZone: "Europe/Paris" },
        end: { dateTime: input.end, timeZone: "Europe/Paris" },
      },
    });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Erreur ajout événement :", error);
    return NextResponse.json({ error: "Impossible d'ajouter l'événement" }, { status: 500 });
  }
}

// ─── PUT : modifier un événement (admin) ───
export async function PUT(req: NextRequest) {
  const guard = await requireRole(req, "admin");
  if ("response" in guard) return guard.response;

  const body = await req.json().catch(() => null);
  if (typeof body?.id !== "string" || !EVENT_ID.test(body.id)) {
    return NextResponse.json({ error: "ID de l'événement invalide" }, { status: 400 });
  }
  const input = parseEventInput(body);
  if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });

  try {
    await getCalendar().events.update({
      calendarId: CALENDAR_ID(),
      eventId: body.id,
      requestBody: {
        summary: input.summary,
        location: input.location,
        description: input.description,
        start: { dateTime: input.start, timeZone: "Europe/Paris" },
        end: { dateTime: input.end, timeZone: "Europe/Paris" },
      },
    });
    return NextResponse.json({ message: "Événement mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur mise à jour événement :", error);
    return NextResponse.json({ error: "Impossible de mettre à jour l'événement" }, { status: 500 });
  }
}

// ─── DELETE : supprimer un événement (admin) ───
export async function DELETE(req: NextRequest) {
  const guard = await requireRole(req, "admin");
  if ("response" in guard) return guard.response;

  const body = await req.json().catch(() => null);
  if (typeof body?.id !== "string" || !EVENT_ID.test(body.id)) {
    return NextResponse.json({ error: "ID de l'événement invalide" }, { status: 400 });
  }

  try {
    await getCalendar().events.delete({ calendarId: CALENDAR_ID(), eventId: body.id });
    return NextResponse.json({ message: "Événement supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression événement :", error);
    return NextResponse.json({ error: "Impossible de supprimer l'événement" }, { status: 500 });
  }
}
