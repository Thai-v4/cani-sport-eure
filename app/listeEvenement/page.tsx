"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Lock, Search } from "lucide-react";
import supabase from "@/lib/supabaseClient";
import { formatDayNumber, formatMonthLong, monthKey } from "@/lib/format";
import { DEMO, demoEvents } from "@/lib/demo";
import PageHeader from "../components/site/PageHeader";

type ClubEvent = {
  id: number | string;
  titre: string;
  contenu: string | null;
  date: string;
  heure_debut: string | null;
  heure_fin: string | null;
  type: string | null;
  image_url: string | null;
};

const weekday = new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: "Europe/Paris" });
const hour = (value: string | null) => (value ? value.slice(0, 5).replace(":", " h ") : null);
const todayKey = () => new Date().toISOString().slice(0, 10);

const localHour = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

// Données de démonstration locales converties au format de la table evenements
const demoRows = (): ClubEvent[] =>
  demoEvents.map((e) => ({
    id: e.id,
    titre: e.title,
    contenu: `${e.location}. Texte fictif de démonstration.`,
    date: e.start.slice(0, 10),
    heure_debut: localHour(e.start),
    heure_fin: e.end ? localHour(e.end) : null,
    type: e.isPrivate ? "interne" : "externe",
    image_url: null,
  }));

export default function AgendaPage() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    if (DEMO) {
      setEvents(demoRows());
      setStatus("ready");
      return;
    }
    supabase
      .from("evenements")
      .select("id, titre, contenu, date, heure_debut, heure_fin, type, image_url")
      .order("date", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setStatus("error");
          return;
        }
        setEvents((data as ClubEvent[]) ?? []);
        setStatus("ready");
      });
  }, []);

  const hasFilters = Boolean(query || from || to);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const today = todayKey();
    return events.filter((e) => {
      const day = e.date.slice(0, 10);
      if (!showPast && !from && day < today) return false;
      return (
        (!q || e.titre.toLowerCase().includes(q) || (e.contenu ?? "").toLowerCase().includes(q)) &&
        (!from || day >= from) &&
        (!to || day <= to)
      );
    });
  }, [events, query, from, to, showPast]);

  // Regroupement par mois, dans l'ordre chronologique
  const months = useMemo(() => {
    const groups = new Map<string, ClubEvent[]>();
    filtered.forEach((e) => {
      const key = monthKey(e.date);
      groups.set(key, [...(groups.get(key) ?? []), e]);
    });
    return Array.from(groups.entries());
  }, [filtered]);

  return (
    <>
      <PageHeader
        title="Agenda"
        description={"Sorties, entraînements et courses du club. Les rendez-vous marqués «\u00a0Adhérents\u00a0» sont réservés aux membres."}
      >
        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="mt-10 grid gap-4 border-y border-rule py-5 md:grid-cols-[1fr_auto_auto_auto] md:items-end"
        >
          <div>
            <label htmlFor="recherche-agenda" className="field-label">
              Rechercher
            </label>
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
              <input
                id="recherche-agenda"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nom de l'événement, lieu…"
                className="field pl-9"
              />
            </div>
          </div>
          <div>
            <label htmlFor="agenda-du" className="field-label">
              Du
            </label>
            <input id="agenda-du" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
          </div>
          <div>
            <label htmlFor="agenda-au" className="field-label">
              Au
            </label>
            <input id="agenda-au" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
          </div>
          <button
            type="button"
            className="btn-quiet"
            disabled={!hasFilters}
            onClick={() => {
              setQuery("");
              setFrom("");
              setTo("");
            }}
          >
            Effacer
          </button>
        </form>
      </PageHeader>

      <div className="site-container pb-24">
        {status === "loading" && (
          <div aria-hidden className="space-y-6 border-t border-ink pt-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-8">
                <div className="h-14 w-16 bg-wash" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-1/2 bg-wash" />
                  <div className="h-4 w-1/4 bg-wash" />
                </div>
              </div>
            ))}
          </div>
        )}

        {status === "error" && (
          <p className="text-ink-2">L&apos;agenda ne se charge pas pour le moment. Réessayez un peu plus tard.</p>
        )}

        {status === "ready" && months.length === 0 && (
          <p className="border-t border-ink pt-6 text-ink-2">
            {hasFilters
              ? "Aucun événement ne correspond à ces critères."
              : "Aucun événement à venir n'est publié pour le moment."}
          </p>
        )}

        {status === "ready" &&
          months.map(([key, list]) => (
            <section key={key} aria-labelledby={`mois-${key}`} className="grid gap-4 border-t border-ink pb-10 pt-5 md:grid-cols-12">
              <h2 id={`mois-${key}`} className="text-sm font-semibold capitalize md:col-span-3">
                <span className="md:sticky md:top-24">{formatMonthLong(list[0].date)}</span>
              </h2>
              <ul className="divide-y divide-rule md:col-span-9">
                {list.map((event) => (
                  <li key={event.id}>
                    <details className="group">
                      <summary className="grid cursor-pointer list-none grid-cols-[4.5rem_1fr_auto] items-baseline gap-x-6 py-5 [&::-webkit-details-marker]:hidden">
                        <time dateTime={event.date} className="display text-5xl leading-none">
                          {formatDayNumber(event.date)}
                        </time>
                        <span>
                          <span className="block text-xl font-bold group-hover:text-line">{event.titre}</span>
                          <span className="mt-1 block text-ink-2 first-letter:uppercase">
                            {weekday.format(new Date(event.date))}
                            {hour(event.heure_debut) && <> · {hour(event.heure_debut)}</>}
                            {hour(event.heure_fin) && <> – {hour(event.heure_fin)}</>}
                          </span>
                          {event.type === "interne" && (
                            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ink-2">
                              <Lock aria-hidden className="size-3" />
                              Adhérents
                            </span>
                          )}
                        </span>
                        <ChevronDown aria-hidden className="size-5 text-ink-3 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="grid gap-6 pb-7 sm:grid-cols-[1fr_14rem] sm:pl-[6rem]">
                        <p className="max-w-[60ch] whitespace-pre-line text-ink-2">
                          {event.contenu || "Pas de description pour cet événement."}
                        </p>
                        {event.image_url && (
                          <div className="relative aspect-[4/3] bg-wash">
                            <Image src={event.image_url} alt="" fill sizes="14rem" className="object-cover" />
                          </div>
                        )}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ))}

        {status === "ready" && !from && (
          <button type="button" onClick={() => setShowPast((v) => !v)} className="link-line mt-2">
            {showPast ? "Masquer les événements passés" : "Afficher aussi les événements passés"}
          </button>
        )}
      </div>
    </>
  );
}
