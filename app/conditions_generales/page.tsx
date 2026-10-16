import type { Metadata } from "next";
import Link from "next/link";
import { CLUB } from "@/lib/club";
import LegalPage from "../components/legal/LegalPage";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function ConditionsPage() {
  return (
    <LegalPage title="Conditions d'utilisation" updated="30 septembre 2026">
      <p>
        Bienvenue sur le site de l&apos;association {CLUB.nom}. En utilisant ce site, vous acceptez les présentes
        conditions générales d&apos;utilisation (CGU).
      </p>

      <h2>Objet du site</h2>
      <p>
        Le site présente les activités, les événements et les informations de l&apos;association {CLUB.nom}, et donne
        à ses adhérents un espace personnel.
      </p>

      <h2>Accès au site</h2>
      <p>
        L&apos;accès au site est gratuit. L&apos;utilisateur reste responsable de son équipement et de son accès à
        Internet. L&apos;association ne peut être tenue responsable d&apos;un dysfonctionnement lié à l&apos;utilisation
        du site.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Tous les contenus (textes, images, vidéos, graphiques, logos…) appartiennent à l&apos;association ou à leurs
        auteurs. Toute reproduction, distribution, modification ou utilisation sans autorisation écrite est interdite.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Les informations collectées sont traitées conformément à la{" "}
        <Link href="/politique-confidentialite">politique de confidentialité</Link>. Vous disposez d&apos;un droit
        d&apos;accès, de rectification et de suppression de vos données en écrivant à{" "}
        <a href={`mailto:${CLUB.email}`}>{CLUB.email}</a>.
      </p>

      <h2>Responsabilité</h2>
      <p>
        L&apos;association s&apos;efforce de publier des informations exactes et à jour, sans pouvoir être tenue
        responsable des erreurs, des omissions ou des dommages résultant de l&apos;utilisation du site.
      </p>

      <h2>Liens externes</h2>
      <p>
        Le site contient des liens vers d&apos;autres sites, sur lesquels l&apos;association n&apos;a aucun contrôle et
        dont elle ne peut être tenue responsable.
      </p>

      <h2>Modification des CGU</h2>
      <p>
        L&apos;association peut modifier ces conditions à tout moment. Les modifications prennent effet dès leur
        publication sur le site.
      </p>

      <h2>Loi applicable</h2>
      <p>Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux français sont compétents.</p>
    </LegalPage>
  );
}
