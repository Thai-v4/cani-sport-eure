"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { Line } from "react-chartjs-2";
import { CategoryScale, Chart as ChartJS, LineElement, LinearScale, PointElement, Tooltip } from "chart.js";
import supabase from "@/lib/supabaseClient";
import { useAuth } from "@/app/components/Auth/AuthProvider";
import { useUpcoming } from "@/lib/agenda";
import { formatDayLong, formatFullDate, formatTime } from "@/lib/format";
import { sportLabel } from "@/lib/sports";
import TraitLine from "@/app/components/site/TraitLine";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

type Result = {
  nomActivite: string | null;
  lieu: string | null;
  distance: string | null;
  classement: string | number | null;
  date: string;
};

type Dog = { id: string; prenom: string; race: string | null; photo_chien: string | null };

const LINKS = [
  { href: "/agenda", label: "Calendrier du club" },
  { href: "/resultats", label: "Résultats du club" },
  { href: "/album", label: "Album photo" },
  { href: "/Document", label: "Documents" },
  { href: "/creation-profil", label: "Mon profil" },
];

const toNumber = (v: unknown) => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
};
const rankLabel = (v: unknown) => {
  const n = parseInt(String(v ?? ""), 10);
  if (!n) return "—";
  return n === 1 ? "1er" : `${n}e`;
};

export default function MemberDashboard() {
  const { user } = useAuth();
  const { events, nextOuting, loading: agendaLoading } = useUpcoming();
  const [results, setResults] = useState<Result[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [activity, setActivity] = useState("");
  const [tense, setTense] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("resultats")
        .select("nomActivite, lieu, distance, classement, date")
        .eq("id_profil", user.id)
        .order("date", { ascending: false }),
      supabase.from("chiens").select("id, prenom, race, photo_chien").eq("id_profil", user.id).order("prenom"),
    ]).then(([res, dogsRes]) => {
      if (res.error || dogsRes.error) {
        setStatus("error");
        return;
      }
      const list = (res.data as Result[]) ?? [];
      setResults(list);
      setDogs((dogsRes.data as Dog[]) ?? []);
      setActivity(list.find((r) => r.nomActivite)?.nomActivite ?? "");
      setStatus("ready");
    });
  }, [user]);

  const activities = useMemo(
    () => Array.from(new Set(results.map((r) => r.nomActivite).filter((a): a is string => Boolean(a)))),
    [results]
  );

  const stats = useMemo(() => {
    const ranks = results.map((r) => parseInt(String(r.classement ?? ""), 10)).filter((n) => n > 0);
    return {
      races: results.length,
      km: results.reduce((sum, r) => sum + toNumber(r.distance), 0),
      best: ranks.length ? Math.min(...ranks) : null,
      podiums: ranks.filter((n) => n <= 3).length,
    };
  }, [results]);

  const chartResults = useMemo(
    () => results.filter((r) => r.nomActivite === activity).slice(0, 12).reverse(),
    [results, activity]
  );

  const next = nextOuting
    ? { date: nextOuting.date_time, title: nextOuting.name, detail: sportLabel(nextOuting.sport), href: "/SortieCanine" }
    : events[0]
      ? { date: events[0].start, title: events[0].title, detail: events[0].location, href: "/agenda" }
      : null;

  const firstName = (user?.user_metadata?.first_name as string | undefined) ?? "";

  return (
    <div className="site-container pb-24 pt-12 md:pt-16">
      <h1 className="display text-[clamp(2.75rem,6.5vw,5rem)]">{firstName ? `Bonjour, ${firstName}.` : "Mon espace"}</h1>

      {/* Prochain rendez-vous, relié par la ligne */}
      <section aria-labelledby="titre-prochaine" className="mt-12 grid gap-10 border-t border-ink pt-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 id="titre-prochaine" className="text-sm font-semibold">
            Prochain rendez-vous
          </h2>
          {agendaLoading ? (
            <div aria-hidden className="mt-4 h-12 w-2/3 bg-wash" />
          ) : next ? (
            <Link
              href={next.href}
              className="group mt-3 flex flex-col gap-4 sm:flex-row sm:items-center"
              onMouseEnter={() => setTense(true)}
              onMouseLeave={() => setTense(false)}
              onFocus={() => setTense(true)}
              onBlur={() => setTense(false)}
            >
              <time dateTime={next.date} className="display shrink-0 text-4xl first-letter:uppercase md:text-5xl">
                {formatDayLong(next.date)}
              </time>
              <TraitLine tense={tense} className="hidden min-w-10 flex-1 sm:block" />
              <span className="shrink-0 sm:max-w-[16rem]">
                <span className="block font-semibold group-hover:text-line">{next.title}</span>
                <span className="block text-sm text-ink-2">
                  {formatTime(next.date)}
                  {next.detail && <> · {next.detail}</>}
                </span>
              </span>
            </Link>
          ) : (
            <p className="mt-3 text-ink-2">Aucun rendez-vous publié pour le moment.</p>
          )}
        </div>
        <nav aria-label="Accès rapides" className="lg:col-span-4 lg:col-start-9">
          <ul className="divide-y divide-rule border-y border-rule">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="group flex items-center justify-between py-3 font-medium hover:text-line">
                  {link.label}
                  <ArrowRight aria-hidden className="size-4 text-ink-3 group-hover:text-line" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      {status === "error" && (
        <p className="mt-16 border-t border-ink pt-6 text-ink-2">Vos résultats et vos chiens ne se chargent pas pour le moment.</p>
      )}

      {/* Mes résultats */}
      <section aria-labelledby="titre-resultats" className="mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="titre-resultats" className="display text-3xl md:text-4xl">
            Mes résultats
          </h2>
          <Link href="/resultats" className="inline-flex items-center gap-1.5 font-semibold text-line hover:underline">
            Tous les résultats du club
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        <dl className="mt-6 grid grid-cols-2 border-t border-ink md:grid-cols-4">
          {[
            { label: "Courses", value: status === "ready" ? String(stats.races) : "—" },
            { label: "Kilomètres", value: status === "ready" ? stats.km.toFixed(1).replace(".", ",") : "—" },
            { label: "Meilleur classement", value: stats.best ? rankLabel(stats.best) : "—" },
            { label: "Podiums", value: status === "ready" ? String(stats.podiums) : "—" },
          ].map((item, i) => (
            <div key={item.label} className={`py-5 pr-4 ${i > 0 ? "md:border-l md:border-rule md:pl-6" : ""} ${i % 2 === 1 ? "border-l border-rule pl-6 md:pl-6" : ""}`}>
              <dt className="text-sm text-ink-3">{item.label}</dt>
              <dd className="display mt-1 text-4xl tabular">{item.value}</dd>
            </div>
          ))}
        </dl>

        {status === "ready" && results.length === 0 && (
          <p className="border-t border-rule pt-5 text-ink-2">Aucun résultat enregistré pour vous pour l&apos;instant.</p>
        )}

        {status === "ready" && results.length > 0 && (
          <div className="grid gap-10 border-t border-rule pt-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Distance par course</h3>
                {activities.length > 1 && (
                  <select aria-label="Activité" value={activity} onChange={(e) => setActivity(e.target.value)} className="field w-auto min-h-9 py-1 text-sm">
                    {activities.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="mt-4 h-64">
                <Line
                  data={{
                    labels: chartResults.map((r) => formatFullDate(r.date)),
                    datasets: [
                      {
                        label: "Distance (km)",
                        data: chartResults.map((r) => toNumber(r.distance)),
                        borderColor: "#1238d6",
                        backgroundColor: "#1238d6",
                        borderWidth: 2,
                        pointRadius: 3,
                        tension: 0.35,
                      },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: { display: false }, ticks: { color: "#6b6f76", maxRotation: 0, autoSkip: true } },
                      y: { grid: { color: "#e3e4e6" }, border: { display: false }, ticks: { color: "#6b6f76" } },
                    },
                  }}
                  aria-label="Graphique des distances parcourues par course"
                  role="img"
                />
              </div>
            </div>
            <div className="lg:col-span-5">
              <h3 className="text-sm font-semibold">Dernières courses</h3>
              <ul className="mt-4 divide-y divide-rule border-t border-rule">
                {results.slice(0, 5).map((r, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-4 py-3">
                    <span>
                      <span className="block font-medium">{r.nomActivite ?? "Course"}</span>
                      <span className="block text-sm text-ink-3">
                        {formatFullDate(r.date)}
                        {r.lieu && <> · {r.lieu}</>}
                      </span>
                    </span>
                    <span className="display shrink-0 text-2xl">{rankLabel(r.classement)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Mes chiens */}
      <section aria-labelledby="titre-chiens" className="mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="titre-chiens" className="display text-3xl md:text-4xl">
            Mes chiens
          </h2>
          <Link href="/creation-chien" className="btn-quiet">
            <Plus aria-hidden className="size-4" />
            Ajouter un chien
          </Link>
        </div>
        {status === "ready" && dogs.length === 0 && (
          <p className="mt-6 border-t border-ink pt-5 text-ink-2">Présentez-nous votre coéquipier : ajoutez la fiche de votre chien.</p>
        )}
        {dogs.length > 0 && (
          <ul className="mt-6 grid gap-8 border-t border-ink pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {dogs.map((dog) => (
              <li key={dog.id}>
                <Link href={`/creation-chien/${dog.id}`} className="group block">
                  <div className="relative aspect-square overflow-hidden bg-wash">
                    {dog.photo_chien ? (
                      <Image src={dog.photo_chien} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center text-sm text-ink-3">Pas de photo</span>
                    )}
                  </div>
                  <p className="mt-3 text-lg font-bold group-hover:text-line">{dog.prenom}</p>
                  {dog.race && <p className="text-sm text-ink-3">{dog.race}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
