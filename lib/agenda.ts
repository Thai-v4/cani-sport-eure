"use client";

import { useEffect, useState } from "react";
import supabase from "./supabaseClient";
import { DEMO, demoEvents, demoOuting } from "./demo";

// Événement de l'agenda Google tel que servi par /api/calendar
export type AgendaEvent = {
  id: string;
  title: string;
  start: string;
  end: string | null;
  location: string;
  details: string;
  isPrivate: boolean;
};

// Prochaine sortie avec trace GPX (table gpx_tracks)
export type Outing = {
  id: string;
  name: string;
  sport: string | null;
  date_time: string;
};

type RawCalendarEvent = {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string | null };
  end?: { dateTime?: string | null };
  location?: string;
};

function toAgendaEvent(raw: RawCalendarEvent): AgendaEvent | null {
  if (!raw.start?.dateTime) return null;
  const [, visibility, ...details] = (raw.description || "").split("::");
  return {
    id: raw.id,
    title: raw.summary || "Événement du club",
    start: raw.start.dateTime,
    end: raw.end?.dateTime ?? null,
    location: raw.location || "",
    details: details.join("::"),
    isPrivate: visibility === "private",
  };
}

type Upcoming = {
  events: AgendaEvent[];
  nextOuting: Outing | null;
  failed: boolean;
};

type State = Upcoming & { loading: boolean };

// Une seule requête par chargement de page, partagée par tous les composants
let cache: { at: number; promise: Promise<Upcoming> } | null = null;
const TTL_MS = 60_000;

function loadUpcoming(): Promise<Upcoming> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.promise;
  if (DEMO) return Promise.resolve({ events: demoEvents, nextOuting: demoOuting, failed: false });

  const loadEvents = fetch("/api/calendar")
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then((data: RawCalendarEvent[]) =>
      (Array.isArray(data) ? data : []).map(toAgendaEvent).filter((e): e is AgendaEvent => e !== null)
    );

  const loadOuting = supabase
    .from("gpx_tracks")
    .select("id, name, sport, date_time")
    .gte("date_time", new Date().toISOString())
    .order("date_time", { ascending: true })
    .limit(1)
    .then(({ data, error }) => {
      if (error) throw error;
      return (data?.[0] as Outing | undefined) ?? null;
    });

  const promise = Promise.allSettled([loadEvents, loadOuting]).then(([events, outing]) => ({
    events: events.status === "fulfilled" ? events.value : [],
    nextOuting: outing.status === "fulfilled" ? outing.value : null,
    failed: events.status === "rejected" && outing.status === "rejected",
  }));
  cache = { at: Date.now(), promise };
  return promise;
}

// Agenda à venir + prochaine sortie. Chaque source peut échouer sans bloquer l'autre.
export function useUpcoming(limit = 12): State {
  const [state, setState] = useState<State>({ events: [], nextOuting: null, loading: true, failed: false });

  useEffect(() => {
    let cancelled = false;
    loadUpcoming().then((result) => {
      if (!cancelled) setState({ ...result, events: result.events.slice(0, limit), loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return state;
}
