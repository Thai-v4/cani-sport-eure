"use client"; // Indique que ce composant s'exécute côté client

import { useEffect, useState } from "react"; // Hooks React pour l'état et les effets
import EventCard from "../components/EventCard"; // Composant pour afficher un événement
import AddEventModal from "../components/AddEventModal"; // Modal pour ajouter un événement
import supabase from "@/lib/supabaseClient"; // Client Supabase pour la base de données
import SidebarAdmin from "../components/SidebarAdmin"; // Barre latérale admin
import { FaSearch } from "react-icons/fa"; // Icône de recherche
import { useAuth } from "../components/Auth/AuthProvider"; // Hook d'authentification
import { useRouter } from "next/navigation"; // Navigation Next.js

// Interface définissant la structure d'un événement
interface Event {
  id: number;
  titre: string;
  contenu: string;
  date: string;
  type: string;
  created_at: string;
  image_url: string;
  id_profil: number;
  auteur: {
    nom: string;
    avatar_url: string;
  };
}

const EventsPage = () => {
  // Récupération des données d'authentification et du routeur
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  // États pour gérer les données et l'interface
  const [events, setEvents] = useState<Event[]>([]); // Liste des événements
  const [searchQuery, setSearchQuery] = useState(""); // Texte de recherche
  const [isModalOpen, setIsModalOpen] = useState(false); // État d'ouverture de la modale

  // Protection de la route - redirection si non admin
  useEffect(() => {
    if (!isLoading && (!user || role !== "admin")) {
      router.replace("/connexion");
    }
  }, [isLoading, user, role, router]);

  // Récupération des événements depuis Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      // Requête à la base de données
      const { data, error } = await supabase.from("evenements").select("*");

      if (error) {
        console.error("Erreur lors de la récupération des événements:", error);
        return;
      }

      // Enrichissement des événements avec les infos des auteurs
      const eventsWithProfiles = await Promise.all(
        data.map(async (event) => {
          // Récupération des données du profil pour chaque événement
          const { data: profileData } = await supabase
            .from("profils_publics")
            .select("nom, photo_profil")
            .eq("id", event.id_profil)
            .single();

          // Fusion des données d'événement avec les données de profil
          return {
            ...event,
            auteur: {
              nom: profileData?.nom || "Auteur inconnu",
              avatar_url: profileData?.photo_profil || "/default-avatar.png",
            },
          };
        })
      );

      setEvents(eventsWithProfiles);
    };

    // Chargement des données si l'utilisateur est admin
    if (user && role === "admin") {
      fetchEvents();
    }
  }, [user, role]);

  // Filtrage des événements selon le terme de recherche
  const filteredEvents = events.filter((event) =>
    event.titre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Ne rien rendre pendant le chargement ou si l'utilisateur n'est pas admin
  if (isLoading || !user || role !== "admin") return null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Barre latérale avec bouton d'ajout */}
      <SidebarAdmin onAdd={() => setIsModalOpen(true)} />

      <div className="p-6 py-16 mx-auto flex-1 flex flex-col">
        {/* Barre de recherche */}
        <div className="relative w-full max-w-xl mb-6">
          <input
            type="text"
            placeholder="Rechercher un événement"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 pl-4 pr-10 text-base sm:text-lg border rounded-full focus:outline-hidden focus:ring-2 focus:ring-blue-900 shadow-md"
          />
          <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-900 text-base sm:text-lg" />
        </div>

        {/* Liste des événements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto p-2">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} isEditable />
          ))}
        </div>
      </div>

      {/* Modale d'ajout d'événement */}
      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default EventsPage;
