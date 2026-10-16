"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import supabase from "@/lib/supabaseClient";
import PageHeader from "../components/site/PageHeader";

type Album = { name: string; coverUrl: string; count: number; dates: string[] };

const IMAGE = /\.(png|jpe?g|gif|webp)$/i;

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: folders, error } = await supabase.storage.from("photo").list("", {
        limit: 200,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) {
        setStatus("error");
        return;
      }
      const results = await Promise.all(
        (folders ?? []).map(async (folder) => {
          const { data: files } = await supabase.storage.from("photo").list(folder.name, { limit: 500 });
          const images = (files ?? []).filter((f) => IMAGE.test(f.name));
          if (images.length === 0) return null;
          return {
            name: folder.name,
            coverUrl: supabase.storage.from("photo").getPublicUrl(`${folder.name}/${images[0].name}`).data.publicUrl,
            count: images.length,
            dates: images.map((i) => i.created_at).filter(Boolean) as string[],
          };
        })
      );
      setAlbums(results.filter((a): a is Album => a !== null));
      setStatus("ready");
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return albums.filter(
      (a) =>
        (!q || a.name.toLowerCase().includes(q)) &&
        (!from && !to
          ? true
          : a.dates.some((d) => {
              const day = d.slice(0, 10);
              return (!from || day >= from) && (!to || day <= to);
            }))
    );
  }, [albums, query, from, to]);

  return (
    <>
      <PageHeader title="Album photo" description="Les photos des sorties et des courses du club, réservées aux adhérents.">
        <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-10 grid gap-4 border-y border-rule py-5 md:grid-cols-[1fr_auto_auto] md:items-end">
          <div>
            <label htmlFor="recherche-album" className="field-label">
              Rechercher un album
            </label>
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
              <input id="recherche-album" type="search" value={query} onChange={(e) => setQuery(e.target.value)} className="field pl-9" />
            </div>
          </div>
          <div>
            <label htmlFor="album-du" className="field-label">
              Photos du
            </label>
            <input id="album-du" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field" />
          </div>
          <div>
            <label htmlFor="album-au" className="field-label">
              Au
            </label>
            <input id="album-au" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field" />
          </div>
        </form>
      </PageHeader>

      <div className="site-container pb-24">
        {status === "loading" && (
          <div aria-hidden className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/3] bg-wash" />
            ))}
          </div>
        )}
        {status === "error" && <p className="text-ink-2">Les albums ne se chargent pas pour le moment. Réessayez un peu plus tard.</p>}
        {status === "ready" && filtered.length === 0 && (
          <p className="border-t border-ink pt-6 text-ink-2">
            {albums.length === 0 ? "Aucun album pour l'instant." : "Aucun album ne correspond à ces critères."}
          </p>
        )}
        {status === "ready" && filtered.length > 0 && (
          <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((album) => (
              <li key={album.name}>
                <Link href={`/gallery/${encodeURIComponent(album.name)}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-wash">
                    <Image src={album.coverUrl} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  </div>
                  <h2 className="mt-3 text-xl font-bold group-hover:text-line">{album.name}</h2>
                  <p className="text-sm text-ink-3">
                    {album.count} photo{album.count > 1 ? "s" : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
