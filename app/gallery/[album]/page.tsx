"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import supabase from "@/lib/supabaseClient";
import Lightbox from "../../components/member/Lightbox";

type Photo = { url: string; name: string };

const IMAGE = /\.(png|jpe?g|gif|webp)$/i;

export default function AlbumPage() {
  const { album } = useParams<{ album: string }>();
  const name = decodeURIComponent(album);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    supabase.storage
      .from("photo")
      .list(name, { limit: 500, sortBy: { column: "created_at", order: "asc" } })
      .then(({ data, error }) => {
        if (error) {
          setStatus("error");
          return;
        }
        setPhotos(
          (data ?? [])
            .filter((f) => IMAGE.test(f.name))
            .map((f) => ({ name: f.name, url: supabase.storage.from("photo").getPublicUrl(`${name}/${f.name}`).data.publicUrl }))
        );
        setStatus("ready");
      });
  }, [name]);

  return (
    <div className="site-container pb-24 pt-10">
      <Link href="/album" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" />
        Album photo
      </Link>
      <h1 className="display mt-6 text-[clamp(2.5rem,5vw,4rem)]">{name}</h1>
      {status === "ready" && (
        <p className="mt-2 text-ink-3">
          {photos.length} photo{photos.length > 1 ? "s" : ""}
        </p>
      )}

      <div className="mt-10 border-t border-ink pt-8">
        {status === "loading" && <p className="text-ink-2">Chargement des photos…</p>}
        {status === "error" && <p className="text-ink-2">Cet album ne se charge pas pour le moment.</p>}
        {status === "ready" && photos.length === 0 && <p className="text-ink-2">Cet album est vide.</p>}
        {status === "ready" && photos.length > 0 && (
          <ul className="columns-2 gap-4 md:columns-3 xl:columns-4">
            {photos.map((photo, index) => (
              <li key={photo.url} className="mb-4 break-inside-avoid">
                <button type="button" onClick={() => setOpen(index)} className="block w-full" aria-label={`Agrandir la photo ${index + 1}`}>
                  <Image src={photo.url} alt="" width={800} height={600} sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw" className="h-auto w-full bg-wash" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open !== null && <Lightbox images={photos} index={open} onChange={setOpen} />}
    </div>
  );
}
