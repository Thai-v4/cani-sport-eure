"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Download, MapPin } from "lucide-react";
import type { LatLngTuple } from "leaflet";
import { formatDayLong, formatTime } from "@/lib/format";
import { sportLabel } from "@/lib/sports";
import { trackStats, type LonLatEle } from "@/lib/gpx";
import { reverseGeocode } from "@/lib/geocode";

const OutingMap = dynamic(() => import("./OutingMap"), {
  ssr: false,
  loading: () => <div className="size-full bg-wash" />,
});

export type Track = {
  id: string;
  name: string;
  sport: string | null;
  date_time: string;
  file_url: string | null;
  geojson: { coordinates: LonLatEle[] } | null;
};

// Une sortie : recto (date, nom, discipline) à gauche, carte de la trace à droite,
// verso dense en dessous (distance, dénivelé, départ, GPX).
export default function OutingRow({ track }: { track: Track }) {
  const coordinates = track.geojson?.coordinates ?? [];
  const hasTrack = coordinates.length > 1;
  const upcoming = new Date(track.date_time) > new Date();
  const stats = useMemo(() => (hasTrack ? trackStats(coordinates) : null), [coordinates, hasTrack]);
  const positions = useMemo<LatLngTuple[]>(() => coordinates.map(([lon, lat]) => [lat, lon]), [coordinates]);
  const [start, setStart] = useState<string | null>(null);

  useEffect(() => {
    if (!hasTrack) return;
    const [lon, lat] = coordinates[0];
    let active = true;
    reverseGeocode(lat, lon).then((label) => active && setStart(label));
    return () => {
      active = false;
    };
  }, [coordinates, hasTrack]);

  return (
    <article className="grid gap-6 py-8 md:grid-cols-12 md:gap-10">
      <div className="md:col-span-5">
        <p className={`text-sm font-semibold ${upcoming ? "text-ink" : "text-ink-3"}`}>
          {upcoming ? "À venir" : "Passée"} · {sportLabel(track.sport)}
        </p>
        <h3 className="mt-2 text-2xl font-bold">{track.name}</h3>
        <p className="mt-1 text-ink-2 first-letter:uppercase">
          <time dateTime={track.date_time}>
            {formatDayLong(track.date_time)} · {formatTime(track.date_time)}
          </time>
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-rule pt-4">
          <div>
            <dt className="text-xs font-semibold text-ink-3">Distance</dt>
            <dd className="display mt-1 text-3xl tabular">{stats ? `${stats.km.toFixed(1).replace(".", ",")} km` : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-ink-3">Dénivelé positif</dt>
            <dd className="display mt-1 text-3xl tabular">{stats && stats.gain > 0 ? `${stats.gain} m` : "—"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs font-semibold text-ink-3">Départ</dt>
            <dd className="mt-1 flex items-start gap-1.5 text-ink-2">
              <MapPin aria-hidden className="mt-1 size-4 shrink-0" />
              {hasTrack ? start ?? "Recherche de l'adresse…" : "Pas de trace pour cette sortie"}
            </dd>
          </div>
        </dl>

        {track.file_url && (
          <a href={track.file_url} download={`${track.name}.gpx`} className="btn-quiet mt-6">
            <Download aria-hidden className="size-4" />
            Télécharger la trace GPX
          </a>
        )}
      </div>

      <div className="relative aspect-[16/10] overflow-hidden bg-wash md:col-span-7">
        {hasTrack ? (
          <OutingMap positions={positions} />
        ) : (
          <p className="absolute inset-0 grid place-items-center text-sm text-ink-3">Carte indisponible</p>
        )}
      </div>
    </article>
  );
}
