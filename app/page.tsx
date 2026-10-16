"use client"; // Directive pour exécuter ce composant côté client

// Import des composants pour les différentes sections de la page d'accueil
import Title from "./components/accueil/TitleSection";
import Presentation from "./components/accueil/PresentationSection";
import AgendaHome from "./components/accueil/AgendaSection";
import Sponsor from "./components/accueil/SponsorSection";
import Sidebar from "./components/sidebars/Sidebar";
import Footer from "./components/sidebars/Footer";
import LatestEvents from "./components/LastestEvents";
import LastestArticles from "./components/LastestArticles";

export default function HomePage() {
  // Structure de la page d'accueil avec différentes sections
  return (
    <main className="bg-cover bg-center">
      <Title /> {/* Section titre/bannière */}
      <Presentation /> {/* Présentation de l'association */}
      <AgendaHome /> {/* Calendrier des événements */}
      <Sponsor /> {/* Section des sponsors */}
      <LatestEvents /> {/* Derniers événements */}
      <LastestArticles /> {/* Derniers articles */}
      <Sidebar /> {/* Barre latérale de navigation */}
      <Footer /> {/* Pied de page */}
    </main>
  );
}
