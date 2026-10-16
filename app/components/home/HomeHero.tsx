"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useUpcoming } from "@/lib/agenda";
import { formatDayLong, formatTime } from "@/lib/format";
import { sportLabel } from "@/lib/sports";
import TraitLine from "../site/TraitLine";

// Premier écran : le titre, l'action, et la ligne tendue jusqu'à la prochaine sortie
export default function HomeHero() {
  const { events, nextOuting, loading } = useUpcoming();
  const [tense, setTense] = useState(false);

  const next = nextOuting
    ? {
        date: nextOuting.date_time,
        title: nextOuting.name,
        detail: sportLabel(nextOuting.sport),
        href: "/SortieCanine",
        linkLabel: "Voir la sortie",
      }
    : events[0]
      ? {
          date: events[0].start,
          title: events[0].title,
          detail: events[0].location,
          href: "/listeEvenement",
          linkLabel: "Voir l'agenda",
        }
      : null;

  const tension = {
    onMouseEnter: () => setTense(true),
    onMouseLeave: () => setTense(false),
    onFocus: () => setTense(true),
    onBlur: () => setTense(false),
  };

  return (
    <section aria-labelledby="titre-accueil" className="site-container pb-16 pt-12 md:pb-24 md:pt-20">
      <h1 id="titre-accueil" className="display max-w-[11ch] text-[clamp(3.25rem,8.4vw,6rem)] text-ink">
        Courir avec son chien dans l&apos;Eure.
      </h1>
      <p className="mt-6 max-w-[36rem] text-lg text-ink-2 md:text-xl">
        Cani-cross, cani-trail, cani-marche, cani-VTT et cani-trottinette. Débutants ou compétiteurs, on sort
        ensemble, et le chien d&apos;abord.
      </p>

      <div className="mt-12 flex flex-col md:flex-row md:items-start">
        <Link href="/SortieCanine" className="btn-line h-13 self-start px-7 text-base" {...tension}>
          Venir à une sortie
        </Link>

        <TraitLine tense={tense} className="mt-3.5 hidden min-w-16 flex-1 md:block" />
        <TraitLine tense={tense} orientation="vertical" className="ml-8 h-12 md:hidden" />

        <div className="md:mt-[25px] md:w-[24rem] md:shrink-0" {...tension}>
          <section aria-label="Prochaine sortie" className="border-t-2 border-ink pt-4">

            {loading && (
              <div aria-hidden className="space-y-3">
                <div className="h-10 w-3/4 bg-wash" />
                <div className="h-4 w-1/2 bg-wash" />
              </div>
            )}

            {!loading && next && (
              <Link href={next.href} className="group block">
                <time dateTime={next.date} className="display block text-[2.5rem] first-letter:uppercase">
                  {formatDayLong(next.date)}
                </time>
                <p className="mt-2 text-ink-2">
                  Prochaine sortie, {formatTime(next.date)}
                  {next.detail && <> · {next.detail}</>}
                </p>
                <p className="mt-1 font-semibold text-ink">{next.title}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 font-semibold text-line group-hover:underline">
                  {next.linkLabel}
                  <ArrowRight aria-hidden className="size-4" />
                </span>
              </Link>
            )}

            {!loading && !next && (
              <div>
                <p className="display text-[2.5rem]">Prochaine sortie à venir</p>
                <p className="mt-2 text-ink-2">
                  La prochaine sortie n&apos;est pas encore publiée. Écrivez-nous, on vous dit quand et où.
                </p>
                <a href="mailto:cani.sports.eure@gmail.com" className="link-line mt-3 inline-block">
                  cani.sports.eure@gmail.com
                </a>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
