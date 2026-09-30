"use client";

import { Lock, MapPin } from "lucide-react";
import type { AgendaEvent } from "@/lib/agenda";
import { formatDayNumber, formatDayShort, formatMonthLong, formatMonthShort, formatTime, monthKey } from "@/lib/format";

type Props = {
  events: AgendaEvent[];
  loading: boolean;
  failed: boolean;
};

// La saison accrochée à la ligne : une rangée continue qui ne passe jamais à la ligne,
// avec le repère « Aujourd'hui » à gauche et le nom du mois posé sur la ligne.
export default function SeasonRail({ events, loading, failed }: Props) {
  const today = new Date();

  return (
    <div
      role="region"
      aria-label="Agenda de la saison"
      tabIndex={0}
      className="relative overflow-x-auto overscroll-x-contain pb-4 pr-8 [scrollbar-width:thin]"
    >
      <ol className="relative flex min-w-max">
        {/* La ligne de trait, sur toute la longueur de la saison */}
        <span aria-hidden className="absolute left-0 right-0 top-10 h-0.5 bg-line" />

        <li className="relative w-28 shrink-0 pr-4 sm:w-44 sm:pr-6">
          <span className="block h-7 text-sm font-semibold text-ink">Aujourd&apos;hui</span>
          <span aria-hidden className="relative z-10 mt-1 block size-3.5 rounded-full bg-line ring-4 ring-paper" />
          <time dateTime={today.toISOString().slice(0, 10)} suppressHydrationWarning className="mt-5 block text-sm text-ink-2">
            {formatDayShort(today)}
          </time>
        </li>

        {loading &&
          [0, 1, 2, 3].map((i) => (
            <li key={i} aria-hidden className="relative w-52 shrink-0 pr-6 sm:w-60 sm:pr-8">
              <span className="block h-7" />
              <span className="relative z-10 ml-px mt-2 block h-4 w-0.5 bg-rule-strong" />
              <span className="mt-4 block h-10 w-14 bg-wash" />
              <span className="mt-3 block h-4 w-40 bg-wash" />
            </li>
          ))}

        {!loading && events.length === 0 && (
          <li className="relative w-[min(36rem,80vw)] shrink-0 pr-8">
            <span className="block h-7" />
            <p className="mt-9 max-w-md whitespace-normal text-ink-2">
              {failed
                ? "L'agenda ne répond pas pour le moment. Réessayez un peu plus tard."
                : "Aucun rendez-vous publié pour le moment. Le bureau annonce aussi les sorties sur Instagram."}{" "}
              {!failed && (
                <a
                  href="https://instagram.com/canisports_eure"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-line"
                >
                  @canisports_eure
                </a>
              )}
            </p>
          </li>
        )}

        {!loading &&
          events.map((event, index) => {
            const newMonth = index === 0 || monthKey(event.start) !== monthKey(events[index - 1].start);
            return (
              <li key={event.id} className="relative w-52 shrink-0 pr-6 sm:w-60 sm:pr-8">
                {/* Nom du mois posé sur la ligne, comme le lettrage d'une sangle */}
                <span className="block h-7">
                  {newMonth && (
                    <span className="relative z-20 ml-3 inline-block translate-y-[33px] bg-paper px-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-3">
                      {formatMonthLong(event.start)}
                    </span>
                  )}
                </span>
                {/* Mousqueton : l'événement est accroché à la ligne */}
                <span aria-hidden className="relative z-10 ml-px mt-2 block h-4 w-0.5 bg-line" />
                <time dateTime={event.start} className="mt-3 flex items-baseline gap-2">
                  <span className="display text-5xl text-ink">{formatDayNumber(event.start)}</span>
                  <span className="text-sm font-semibold uppercase text-ink-2">{formatMonthShort(event.start)}</span>
                </time>
                <p className="mt-2 whitespace-normal font-semibold leading-snug text-ink">{event.title}</p>
                <p className="mt-1 whitespace-normal text-sm text-ink-2">
                  {formatDayShort(event.start)} · {formatTime(event.start)}
                </p>
                {event.location && (
                  <p className="mt-1 flex items-start gap-1 whitespace-normal text-sm text-ink-2">
                    <MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                    {event.location}
                  </p>
                )}
                {event.isPrivate && (
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ink-2">
                    <Lock aria-hidden className="size-3" />
                    Adhérents
                  </p>
                )}
              </li>
            );
          })}
      </ol>
    </div>
  );
}
