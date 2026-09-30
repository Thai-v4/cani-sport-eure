import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Accès réservé" };

export default function Unauthorized() {
  return (
    <div className="site-container py-24 md:py-32">
      <h1 className="display max-w-[14ch] text-[clamp(2.75rem,7vw,5.5rem)]">Cette page est réservée.</h1>
      <p className="mt-6 max-w-[40rem] text-lg text-ink-2">
        Elle est accessible aux adhérents validés ou au bureau du club. Si vous venez de créer votre compte, le bureau
        doit encore le valider.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/" className="btn-line">
          Retour à l&apos;accueil
        </Link>
        <a href="mailto:cani.sports.eure@gmail.com" className="btn-quiet">
          Écrire au bureau
        </a>
      </div>
    </div>
  );
}
