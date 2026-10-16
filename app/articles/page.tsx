"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import supabase from "@/lib/supabaseClient";
import { formatFullDate } from "@/lib/format";
import { DEMO, demoArticles } from "@/lib/demo";
import PageHeader from "../components/site/PageHeader";

type Article = {
  id: string;
  titre: string;
  contenu: string;
  image_url: string | null;
  created_at: string;
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    if (DEMO) {
      setArticles(demoArticles);
      setStatus("ready");
      return;
    }
    supabase
      .from("publication")
      .select("id, titre, contenu, image_url, created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setStatus("error");
          return;
        }
        setArticles((data as Article[]) ?? []);
        setStatus("ready");
      });
  }, []);

  // Filtre sur le titre et le texte ; les bornes de dates sont incluses
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      const day = a.created_at.slice(0, 10);
      return (
        (!q || a.titre.toLowerCase().includes(q) || a.contenu.toLowerCase().includes(q)) &&
        (!from || day >= from) &&
        (!to || day <= to)
      );
    });
  }, [articles, query, from, to]);

  const hasFilters = Boolean(query || from || to);
  const [lead, ...rest] = filtered;

  return (
    <>
      <PageHeader title="Articles" description="Nouvelles du club, retours de courses et conseils pour courir avec son chien.">
        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="mt-10 grid gap-4 border-y border-rule py-5 md:grid-cols-[1fr_auto_auto_auto] md:items-end"
        >
          <div>
            <label htmlFor="recherche-article" className="field-label">
              Rechercher
            </label>
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
              <input
                id="recherche-article"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Titre ou mot du texte"
                className="field pl-9"
              />
            </div>
          </div>
          <div>
            <label htmlFor="article-du" className="field-label">
              Du
            </label>
            <input id="article-du" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
          </div>
          <div>
            <label htmlFor="article-au" className="field-label">
              Au
            </label>
            <input id="article-au" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
          </div>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFrom("");
              setTo("");
            }}
            disabled={!hasFilters}
            className="btn-quiet"
          >
            Effacer
          </button>
        </form>
      </PageHeader>

      <div className="site-container pb-24">
        {status === "loading" && (
          <div aria-hidden className="grid gap-8 md:grid-cols-12">
            <div className="aspect-[3/2] bg-wash md:col-span-7" />
            <div className="space-y-4 md:col-span-5">
              <div className="h-4 w-32 bg-wash" />
              <div className="h-10 w-full bg-wash" />
              <div className="h-20 w-full bg-wash" />
            </div>
          </div>
        )}

        {status === "error" && (
          <p className="text-ink-2">Les articles ne se chargent pas pour le moment. Réessayez un peu plus tard.</p>
        )}

        {status === "ready" && filtered.length === 0 && (
          <p className="text-ink-2">
            {hasFilters ? "Aucun article ne correspond à ces critères." : "Aucun article publié pour l'instant."}
          </p>
        )}

        {status === "ready" && lead && (
          <>
            <p className="sr-only" aria-live="polite">
              {filtered.length} article{filtered.length > 1 ? "s" : ""}
            </p>

            {/* Article le plus récent, en tête */}
            <Link href={`/articles/${lead.id}`} className="group grid gap-8 md:grid-cols-12 md:gap-10">
              {lead.image_url && (
                <div className="relative aspect-[3/2] overflow-hidden bg-wash md:col-span-7">
                  <Image
                    src={lead.image_url}
                    alt=""
                    fill
                    priority
                    sizes="(min-width: 768px) 58vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                </div>
              )}
              <div className={lead.image_url ? "md:col-span-5 md:pt-2" : "md:col-span-8"}>
                <time dateTime={lead.created_at} className="text-sm text-ink-3">
                  {formatFullDate(lead.created_at)}
                </time>
                <h2 className="display mt-3 text-[clamp(2rem,3.6vw,3rem)] group-hover:text-line">{lead.titre}</h2>
                <p className="mt-4 line-clamp-5 text-lg text-ink-2">{lead.contenu}</p>
                <span className="mt-5 inline-block font-semibold text-line group-hover:underline">Lire l&apos;article</span>
              </div>
            </Link>

            {rest.length > 0 && (
              <ul className="mt-16 divide-y divide-rule border-t border-ink">
                {rest.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={`/articles/${article.id}`}
                      className="group grid gap-5 py-7 sm:grid-cols-[12rem_1fr] sm:gap-10"
                    >
                      {article.image_url ? (
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-wash sm:w-48">
                          <Image
                            src={article.image_url}
                            alt=""
                            fill
                            sizes="(min-width: 640px) 12rem, 100vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        </div>
                      ) : (
                        <div aria-hidden className="hidden sm:block" />
                      )}
                      <div>
                        <time dateTime={article.created_at} className="text-sm text-ink-3">
                          {formatFullDate(article.created_at)}
                        </time>
                        <h2 className="mt-1 text-2xl font-bold group-hover:text-line">{article.titre}</h2>
                        <p className="mt-2 line-clamp-2 max-w-[65ch] text-ink-2">{article.contenu}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  );
}
