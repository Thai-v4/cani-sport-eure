"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import supabase from "@/lib/supabaseClient";
import { sportLabel } from "@/lib/sports";
import { DEMO, demoTracks } from "@/lib/demo";
import PageHeader from "../components/site/PageHeader";
import OutingRow, { type Track } from "../components/sorties/OutingRow";

const PAGE = 6;

export default function SortiesPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [sport, setSport] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pastShown, setPastShown] = useState(PAGE);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (DEMO) {
      setTracks(demoTracks as Track[]);
      setStatus("ready");
      return;
    }
    // La fonction SQL renvoie les traces avec leur géométrie en GeoJSON
    supabase.rpc("get_gpx_tracks_geojson").then(({ data, error }) => {
      if (error) {
        setStatus("error");
        return;
      }
      setTracks((data as Track[]) ?? []);
      setStatus("ready");
    });
  }, []);

  const sports = useMemo(
    () => Array.from(new Set(tracks.map((t) => t.sport).filter((s): s is string => Boolean(s)))),
    [tracks]
  );

  const { upcoming, past } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = tracks.filter((t) => (!sport || t.sport === sport) && (!q || t.name.toLowerCase().includes(q)));
    return {
      upcoming: list
        .filter((t) => new Date(t.date_time).getTime() >= now)
        .sort((a, b) => +new Date(a.date_time) - +new Date(b.date_time)),
      past: list
        .filter((t) => new Date(t.date_time).getTime() < now)
        .sort((a, b) => +new Date(b.date_time) - +new Date(a.date_time)),
    };
  }, [tracks, sport, query, now]);

  const tabClass = (active: boolean) =>
    `relative whitespace-nowrap py-3 text-[0.9375rem] font-medium ${active ? "text-ink" : "text-ink-2 hover:text-ink"}`;

  return (
    <>
      <PageHeader
        title="Sorties"
        description="Les parcours du club, avec leur trace GPX, leur distance et leur dénivelé. Choisissez une date et venez avec votre chien."
      >
        <div className="mt-10 flex flex-col gap-4 border-y border-rule md:flex-row md:items-center md:justify-between">
          <div role="group" aria-label="Filtrer par discipline" className="-mb-px flex gap-6 overflow-x-auto [scrollbar-width:none]">
            <button type="button" aria-pressed={sport === null} onClick={() => setSport(null)} className={tabClass(sport === null)}>
              Toutes
              {sport === null && <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-line" />}
            </button>
            {sports.map((s) => (
              <button key={s} type="button" aria-pressed={sport === s} onClick={() => setSport(s)} className={tabClass(sport === s)}>
                {sportLabel(s)}
                {sport === s && <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-line" />}
              </button>
            ))}
          </div>
          <div className="relative pb-4 md:w-72 md:pb-0">
            <label htmlFor="recherche-sortie" className="sr-only">
              Rechercher une sortie
            </label>
            <Search aria-hidden className="pointer-events-none absolute left-3 top-[1.375rem] size-4 -translate-y-1/2 text-ink-3" />
            <input
              id="recherche-sortie"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une sortie"
              className="field pl-9"
            />
          </div>
        </div>
      </PageHeader>

      <div className="site-container pb-24">
        {status === "loading" && (
          <div aria-hidden className="grid gap-10 md:grid-cols-12">
            <div className="space-y-4 md:col-span-5">
              <div className="h-4 w-32 bg-wash" />
              <div className="h-8 w-3/4 bg-wash" />
              <div className="h-24 w-full bg-wash" />
            </div>
            <div className="aspect-[16/10] bg-wash md:col-span-7" />
          </div>
        )}

        {status === "error" && (
          <p className="text-ink-2">Les sorties ne se chargent pas pour le moment. Réessayez un peu plus tard.</p>
        )}

        {status === "ready" && (
          <>
            <section aria-labelledby="titre-a-venir">
              <h2 id="titre-a-venir" className="text-sm font-semibold">
                À venir
              </h2>
              {upcoming.length === 0 ? (
                <p className="mt-4 border-t border-ink pt-6 text-ink-2">
                  Aucune sortie programmée{sport ? " dans cette discipline" : ""} pour le moment. Consultez{" "}
                  <Link href="/listeEvenement" className="link-line">
                    l&apos;agenda
                  </Link>{" "}
                  ou écrivez-nous à{" "}
                  <a href="mailto:cani.sports.eure@gmail.com" className="link-line">
                    cani.sports.eure@gmail.com
                  </a>
                  .
                </p>
              ) : (
                <div className="mt-4 divide-y divide-rule border-t border-ink">
                  {upcoming.map((track) => (
                    <OutingRow key={track.id} track={track} />
                  ))}
                </div>
              )}
            </section>

            {past.length > 0 && (
              <section aria-labelledby="titre-passees" className="mt-20">
                <h2 id="titre-passees" className="text-sm font-semibold">
                  Sorties passées
                </h2>
                <div className="mt-4 divide-y divide-rule border-t border-ink">
                  {past.slice(0, pastShown).map((track) => (
                    <OutingRow key={track.id} track={track} />
                  ))}
                </div>
                {past.length > pastShown && (
                  <button type="button" onClick={() => setPastShown((n) => n + PAGE)} className="btn-quiet mt-8">
                    Afficher plus de sorties ({past.length - pastShown})
                  </button>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
