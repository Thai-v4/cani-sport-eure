import type { Metadata } from "next";
import Link from "next/link";
import { CLUB } from "@/lib/club";
import LegalPage, { ToFill } from "../components/legal/LegalPage";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updated="30 septembre 2026">
      <h2>Éditeur du site</h2>
      <p>
        {CLUB.nom}, association loi 1901.
        <br />
        Siège social : <ToFill value={CLUB.siege} />
        <br />
        Numéro RNA ou SIRET : <ToFill value={CLUB.rna} />
        <br />
        Contact : <a href={`mailto:${CLUB.email}`}>{CLUB.email}</a>
      </p>

      <h2>Responsable de la publication</h2>
      <p>
        <ToFill value={CLUB.responsablePublication} />, pour l&apos;association {CLUB.nom}.
      </p>

      <h2>Hébergement</h2>
      <p>
        Site hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com).
        <br />
        Comptes, contenus et fichiers stockés par Supabase Inc. (supabase.com).
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, photos et logos publiés sur ce site appartiennent à l&apos;association ou à leurs auteurs. Toute
        reproduction sans autorisation écrite est interdite. Les logos des partenaires restent la propriété de leurs
        détenteurs.
      </p>

      <h2>Cartes</h2>
      <p>
        Les fonds de carte des sorties proviennent d&apos;OpenStreetMap, © les contributeurs d&apos;OpenStreetMap, sous
        licence ODbL.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement de vos données est décrit dans la <Link href="/politique-confidentialite">politique de confidentialité</Link>.
      </p>
    </LegalPage>
  );
}
