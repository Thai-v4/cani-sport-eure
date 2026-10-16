"use client";

import Image from "next/image";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";

type Props = {
  images: { url: string; name: string }[];
  index: number;
  onChange: (index: number | null) => void;
};

// Visionneuse plein écran : flèches du clavier, Échap pour fermer
export default function Lightbox({ images, index, onChange }: Props) {
  const image = images[index];
  const prev = () => onChange((index - 1 + images.length) % images.length);
  const next = () => onChange((index + 1) % images.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChange(null);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  });

  if (!image) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={`Photo ${index + 1} sur ${images.length}`} className="fixed inset-0 z-[70] flex flex-col bg-ink text-white">
      <div className="flex items-center justify-between px-4 py-3 text-sm">
        <span className="tabular">
          {index + 1} / {images.length}
        </span>
        <div className="flex items-center gap-1">
          <a href={image.url} download={image.name} className="flex items-center gap-1.5 px-3 py-2 hover:bg-white/10">
            <Download aria-hidden className="size-4" />
            Télécharger
          </a>
          <button type="button" autoFocus onClick={() => onChange(null)} className="flex items-center gap-1.5 px-3 py-2 hover:bg-white/10">
            <X aria-hidden className="size-4" />
            Fermer
          </button>
        </div>
      </div>
      <div className="relative flex-1">
        <Image src={image.url} alt={image.name} fill sizes="100vw" className="object-contain" />
        {images.length > 1 && (
          <>
            <button type="button" onClick={prev} aria-label="Photo précédente" className="absolute left-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center hover:bg-white/10">
              <ChevronLeft aria-hidden className="size-6" />
            </button>
            <button type="button" onClick={next} aria-label="Photo suivante" className="absolute right-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center hover:bg-white/10">
              <ChevronRight aria-hidden className="size-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
