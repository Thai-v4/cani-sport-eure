import type { Metadata } from "next";
import { CLUB } from "@/lib/club";
import LegalPage from "../components/legal/LegalPage";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPage title="Confidentialité" updated="30 septembre 2026">
      <h2>Données collectées</h2>
      <p>Lorsque vous créez un compte et l&apos;utilisez, le club enregistre :</p>
      <ul>
        <li>vos nom, prénom et adresse email ;</li>
        <li>les informations de votre profil : date de naissance, numéro de licence, photo ;</li>
        <li>les informations sur vos chiens que vous saisissez ;</li>
        <li>vos résultats et participations aux événements du club.</li>
      </ul>

      <h2>Utilisation</h2>
      <p>Ces données servent uniquement à :</p>
      <ul>
        <li>gérer votre adhésion et valider votre compte ;</li>
        <li>vous informer des sorties, événements et activités ;</li>
        <li>traiter vos inscriptions aux compétitions et publier les résultats du club aux adhérents ;</li>
        <li>communiquer avec vous sur le fonctionnement du club.</li>
      </ul>
      <p>Elles ne sont ni vendues ni cédées. Seuls les membres du bureau habilités y ont accès.</p>

      <h2>Conservation</h2>
      <p>
        Vos données sont conservées pendant la durée de votre adhésion, puis archivées pendant trois ans après votre
        dernière activité.
      </p>

      <h2>Sous-traitants</h2>
      <p>
        Le site est hébergé par Vercel ; les comptes, contenus et fichiers sont stockés par Supabase ; l&apos;agenda
        s&apos;appuie sur Google Agenda. Les cartes utilisent OpenStreetMap, qui reçoit l&apos;adresse IP des visiteurs
        pour afficher les fonds de carte.
      </p>

      <h2>Cookies</h2>
      <p>
        Le site dépose uniquement les cookies nécessaires à votre connexion. La mesure d&apos;audience (Vercel Analytics)
        fonctionne sans cookie.
      </p>

      <h2>Sécurité</h2>
      <p>
        L&apos;accès aux données est limité selon votre rôle (adhérent, bureau), les échanges sont chiffrés et les
        mots de passe ne sont jamais stockés en clair.
      </p>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;opposition et de
        suppression de vos données. Écrivez à <a href={`mailto:${CLUB.email}`}>{CLUB.email}</a>. Vous pouvez aussi
        adresser une réclamation à la CNIL (cnil.fr).
      </p>
    </LegalPage>
  );
}
