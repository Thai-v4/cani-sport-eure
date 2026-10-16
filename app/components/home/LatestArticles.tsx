"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { formatFullDate } from "@/lib/format";
import { DEMO, demoArticles } from "@/lib/demo";

type Article = {
  id: string;
  titre: string;
  contenu: string;
  image_url: string | null;
  created_at: string;
};

// Derniers articles en lignes éditoriales (pas de grille de cartes)
export default function LatestArticles({ limit = 3 }: { limit?: number }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    if (DEMO) {
      setArticles(demoArticles.slice(0, limit));
      setStatus("ready");
      return;
    }
    supabase
      .from("publication")
      .select("id, titre, contenu, image_url, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setStatus("error");
          return;
        }
        setArticles((data as Article[]) ?? []);
        setStatus("ready");
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (status === "loading") {
    return (
      <ul aria-hidden className="divide-y divide-rule border-t border-rule">
        {Array.from({ length: limit }).map((_, i) => (
          <li key={i} className="flex gap-6 py-6">
            <div className="h-24 w-32 shrink-0 bg-wash" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-24 bg-wash" />
              <div className="h-6 w-2/3 bg-wash" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (status === "error") {
    return <p className="border-t border-rule pt-6 text-ink-2">Les articles ne se chargent pas pour le moment.</p>;
  }

  if (articles.length === 0) {
    return <p className="border-t border-rule pt-6 text-ink-2">Aucun article publié pour l&apos;instant.</p>;
  }

  return (
    <ul className="divide-y divide-rule border-t border-rule">
      {articles.map((article) => (
        <li key={article.id}>
          <Link
            href={`/articles/${article.id}`}
            className="group grid gap-5 py-7 sm:grid-cols-[10rem_1fr] sm:gap-8"
          >
            {/* Sans image : la colonne reste vide sur écran large pour garder l'alignement, rien sur mobile */}
            {article.image_url ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-wash sm:w-40">
                <Image
                  src={article.image_url}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 10rem, 100vw"
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
              <h3 className="mt-1 text-2xl font-bold group-hover:text-line">{article.titre}</h3>
              <p className="mt-2 line-clamp-2 max-w-[65ch] text-ink-2">{article.contenu}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
