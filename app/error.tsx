"use client";

import Link from "next/link";

// Erreur inattendue dans une page : message clair et possibilité de réessayer
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="site-container py-24 md:py-32">
      <h1 className="display max-w-[16ch] text-[clamp(2.5rem,6vw,4.5rem)]">Quelque chose s&apos;est mal passé.</h1>
      <p className="mt-6 max-w-[40rem] text-lg text-ink-2">
        La page n&apos;a pas pu s&apos;afficher. Réessayez ; si le problème continue, écrivez-nous à{" "}
        <a href="mailto:cani.sports.eure@gmail.com" className="link-line">
          cani.sports.eure@gmail.com
        </a>
        .
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn-line">
          Réessayer
        </button>
        <Link href="/" className="btn-quiet">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
