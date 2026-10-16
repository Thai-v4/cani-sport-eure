import Link from "next/link";

export default function NotFound() {
  return (
    <div className="site-container py-24 md:py-32">
      <h1 className="display max-w-[14ch] text-[clamp(2.75rem,7vw,5.5rem)]">Cette page a pris un autre sentier.</h1>
      <p className="mt-6 max-w-[40rem] text-lg text-ink-2">
        Page introuvable (erreur 404) : le lien est peut-être ancien ou la page a été déplacée. Reprenez depuis l&apos;accueil ou l&apos;agenda.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/" className="btn-line">
          Retour à l&apos;accueil
        </Link>
        <Link href="/listeEvenement" className="btn-quiet">
          Voir l&apos;agenda
        </Link>
      </div>
    </div>
  );
}
