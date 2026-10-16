"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, Search } from "lucide-react";
import supabase from "@/lib/supabaseClient";
import { sportLabel } from "@/lib/sports";
import { downloadCsv } from "@/lib/csv";
import PageHeader from "../components/site/PageHeader";

// Catégories de résultats : identifiant de discipline en base
const DISCIPLINES = [
  { key: "Cross", id: 1 },
  { key: "Trail", id: 2 },
  { key: "Marche", id: 3 },
  { key: "VTT", id: 4 },
  { key: "Trottinette", id: 5 },
];

type Result = {
  id: number;
  nomActivite: string | null;
  lieu: string | null;
  region: string | null;
  distance: string | null;
  temps: string | null;
  minKm: string | null;
  vitesse: string | null;
  kmAR: string | null;
  classement: number | null;
  chiens: { prenom: string | null } | null;
  profils: { nom: string | null; prenom: string | null } | null;
};

type SortKey = "participant" | "chien" | "nomActivite" | "lieu" | "distance" | "temps" | "classement";

const PAGE = 20;
const participant = (r: Result) => [r.profils?.prenom, r.profils?.nom].filter(Boolean).join(" ");

export default function ResultsPage() {
  const [types, setTypes] = useState<{ id: number; nom_resultat: string }[]>([]);
  const [typeId, setTypeId] = useState<number | null>(null);
  const [discipline, setDiscipline] = useState(DISCIPLINES[0]);
  const [results, setResults] = useState<Result[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "classement", dir: "asc" });
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    supabase
      .from("resultatType")
      .select("id, nom_resultat")
      .then(({ data, error }) => {
        if (error) return setStatus("error");
        setTypes(data ?? []);
        setTypeId(data?.[0]?.id ?? null);
        if (!data?.length) setStatus("ready");
      });
  }, []);

  useEffect(() => {
    if (typeId === null) return;
    setStatus("loading");
    setShown(PAGE);
    supabase
      .from("resultats")
      .select("*, chiens ( prenom ), profils ( nom, prenom )")
      .eq("id_type", typeId)
      .eq("id_categorie", discipline.id)
      .then(({ data, error }) => {
        if (error) return setStatus("error");
        setResults((data as Result[]) ?? []);
        setStatus("ready");
      });
  }, [typeId, discipline]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const value = (r: Result, key: SortKey): string | number => {
      if (key === "participant") return participant(r).toLowerCase();
      if (key === "chien") return (r.chiens?.prenom ?? "").toLowerCase();
      const v = r[key];
      const n = parseFloat(String(v ?? "").replace(",", "."));
      return Number.isNaN(n) ? String(v ?? "").toLowerCase() : n;
    };
    return results
      .filter((r) =>
        !q ||
        [r.nomActivite, r.lieu, r.region, participant(r), r.chiens?.prenom].some((f) => f && f.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        const va = value(a, sort.key);
        const vb = value(b, sort.key);
        const order = va < vb ? -1 : va > vb ? 1 : 0;
        return sort.dir === "asc" ? order : -order;
      });
  }, [results, query, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const header = (key: SortKey, label: string, className = "") => (
    <th scope="col" aria-sort={sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={`py-3 pr-4 font-semibold ${className}`}>
      <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 hover:text-ink">
        {label}
        {sort.key === key && (sort.dir === "asc" ? <ArrowUp aria-hidden className="size-3" /> : <ArrowDown aria-hidden className="size-3" />)}
      </button>
    </th>
  );

  const exportCsv = () =>
    downloadCsv(
      `resultats-${discipline.key.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Participant", "Chien", "Activité", "Lieu", "Région", "Distance", "Temps", "Min/km", "Vitesse", "Km A/R", "Classement"],
      rows.map((r) => [participant(r), r.chiens?.prenom, r.nomActivite, r.lieu, r.region, r.distance, r.temps, r.minKm, r.vitesse, r.kmAR, r.classement])
    );

  return (
    <>
      <PageHeader
        title="Résultats"
        description="Les résultats des adhérents en course, par discipline."
        actions={
          <button type="button" onClick={exportCsv} disabled={rows.length === 0} className="btn-quiet">
            <Download aria-hidden className="size-4" />
            Exporter en CSV
          </button>
        }
      >
        <div className="mt-10 border-y border-rule">
          <div role="group" aria-label="Discipline" className="-mb-px flex gap-6 overflow-x-auto [scrollbar-width:none]">
            {DISCIPLINES.map((d) => (
              <button
                key={d.key}
                type="button"
                aria-pressed={discipline.key === d.key}
                onClick={() => setDiscipline(d)}
                className={`relative whitespace-nowrap py-3 text-[0.9375rem] font-medium ${discipline.key === d.key ? "text-ink" : "text-ink-2 hover:text-ink"}`}
              >
                {sportLabel(d.key)}
                {discipline.key === d.key && <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-line" />}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-[16rem_1fr]">
          <div>
            <label htmlFor="type-resultat" className="field-label">
              Type de résultat
            </label>
            <select id="type-resultat" value={typeId ?? ""} onChange={(e) => setTypeId(Number(e.target.value))} className="field">
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nom_resultat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="recherche-resultat" className="field-label">
              Rechercher
            </label>
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
              <input id="recherche-resultat" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Participant, chien, lieu…" className="field pl-9" />
            </div>
          </div>
        </div>
      </PageHeader>

      <div className="site-container pb-24">
        {status === "loading" && <p className="text-ink-2">Chargement des résultats…</p>}
        {status === "error" && <p className="text-ink-2">Les résultats ne se chargent pas pour le moment. Réessayez un peu plus tard.</p>}
        {status === "ready" && rows.length === 0 && (
          <p className="border-t border-ink pt-6 text-ink-2">
            {query ? "Aucun résultat ne correspond à cette recherche." : `Aucun résultat enregistré en ${sportLabel(discipline.key).toLowerCase()} pour ce type.`}
          </p>
        )}
        {status === "ready" && rows.length > 0 && (
          <>
            <div className="overflow-x-auto border-t border-ink">
              <table className="w-full min-w-[56rem] text-left text-[0.9375rem]">
                <thead>
                  <tr className="border-b border-rule text-xs text-ink-3">
                    {header("classement", "Rang", "w-16")}
                    {header("participant", "Participant")}
                    {header("chien", "Chien")}
                    {header("nomActivite", "Activité")}
                    {header("lieu", "Lieu")}
                    {header("distance", "Distance")}
                    {header("temps", "Temps")}
                    <th scope="col" className="py-3 pr-4 font-semibold">Min/km</th>
                    <th scope="col" className="py-3 font-semibold">Vitesse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {rows.slice(0, shown).map((r) => (
                    <tr key={r.id}>
                      <td className="display py-3 pr-4 text-2xl text-ink">{r.classement ?? "—"}</td>
                      <td className="py-3 pr-4 font-semibold">{participant(r) || "—"}</td>
                      <td className="py-3 pr-4 text-ink-2">{r.chiens?.prenom ?? "—"}</td>
                      <td className="py-3 pr-4 text-ink-2">{r.nomActivite ?? "—"}</td>
                      <td className="py-3 pr-4 text-ink-2">{[r.lieu, r.region].filter(Boolean).join(", ") || "—"}</td>
                      <td className="py-3 pr-4 text-ink-2">{r.distance ?? "—"}</td>
                      <td className="py-3 pr-4 font-semibold">{r.temps ?? "—"}</td>
                      <td className="py-3 pr-4 text-ink-2">{r.minKm ?? "—"}</td>
                      <td className="py-3 text-ink-2">{r.vitesse ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > shown && (
              <button type="button" onClick={() => setShown((n) => n + PAGE)} className="btn-quiet mt-8">
                Afficher plus ({rows.length - shown})
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
