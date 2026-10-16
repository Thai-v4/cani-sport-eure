"use client";

import { useEffect, useState } from "react";
import EventCard from "../components/EventCard";
import supabase from "@/lib/supabaseClient";
import { FaSearch, FaCalendarAlt, FaFilter, FaTimes } from "react-icons/fa";
import WhiteBackground from "../components/backgrounds/WhiteBackground";
import Sidebar from "../components/sidebars/Sidebar";
import Footer from "../components/sidebars/Footer";
import { motion, AnimatePresence } from "framer-motion";

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

const ListeEvenement = () => {
  // États pour stocker les données et les filtres
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);

  // Récupération des événements au chargement de la page
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        // Récupération des événements depuis Supabase
        const { data, error } = await supabase
          .from("evenements")
          .select("*")
          .order("date", { ascending: true });

        if (error) {
          console.error(
            "Erreur lors de la récupération des événements:",
            error
          );
          return;
        }

        // Enrichissement des événements avec les informations sur l'auteur
        const eventsWithProfiles = await Promise.all(
          data.map(async (event) => {
            // Récupération des données de profil pour chaque événement
            const { data: profileData } = await supabase
              .from("profils_publics")
              .select("nom, photo_profil")
              .eq("id", event.id_profil)
              .single();

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
      } catch (error) {
        console.error("Erreur inattendue:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Calcul du nombre de filtres actifs
  useEffect(() => {
    let count = 0;
    if (startDate) count++;
    if (endDate) count++;
    setActiveFilters(count);
  }, [startDate, endDate]);

  // Filtrage des événements selon la recherche et les dates sélectionnées
  const filteredEvents = events.filter((event) => {
    const isMatchingTitle = event.titre
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const isMatchingAuthor = event.auteur.nom
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const eventDate = new Date(event.date);
    const isWithinDateRange =
      (!startDate || eventDate >= new Date(startDate)) &&
      (!endDate || eventDate <= new Date(endDate));

    return (isMatchingTitle || isMatchingAuthor) && isWithinDateRange;
  });

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setIsFiltersOpen(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Sidebar />

      <WhiteBackground>
        <div className="grow px-4 sm:px-6 lg:px-10 py-6 max-w-7xl mx-auto">
          {/* En-tête de la page */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-2">
              Événements
            </h1>
            <p className="text-gray-600">
              Découvrez nos prochains événements et activités à venir
            </p>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="mb-8">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Rechercher un événement ou un auteur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3 pl-12 pr-12 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-xs transition-all duration-200"
              />
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Effacer la recherche"
                >
                  <FaTimes className="text-lg" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
              >
                <FaFilter />
                <span>Filtres</span>
                {activeFilters > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </button>

              {activeFilters > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>

            {/* Filtres déroulants */}
            <AnimatePresence>
              {isFiltersOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 p-5 bg-white rounded-lg shadow-md border border-gray-100">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                      <FaCalendarAlt className="mr-2 text-blue-600" />
                      Période
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="startDate"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Date de début
                        </label>
                        <input
                          id="startDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="endDate"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Date de fin
                        </label>
                        <input
                          id="endDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Résultats de recherche */}
          <div className="mb-4">
            <p className="text-gray-600">
              {filteredEvents.length === 0
                ? "Aucun événement trouvé"
                : `${filteredEvents.length} événement${filteredEvents.length > 1 ? "s" : ""} trouvé${filteredEvents.length > 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Liste des événements */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-6 bg-gray-200 rounded-sm w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded-sm w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded-sm w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded-sm w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100"
                >
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-xs border border-gray-100">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Aucun événement trouvé
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchQuery || startDate || endDate
                  ? "Aucun événement ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                  : "Il n'y a actuellement aucun événement à venir. Revenez bientôt !"}
              </p>
              {(searchQuery || startDate || endDate) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-xs text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </WhiteBackground>

      <Footer />
    </div>
  );
};

export default ListeEvenement;
