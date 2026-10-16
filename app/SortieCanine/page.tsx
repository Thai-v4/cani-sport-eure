"use client";

import React from "react"; // Ajoutez cet import
import { useEffect, useState, useMemo } from "react";
import supabase from "@/lib/supabaseClient"; // Client Supabase (session partagée)
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaRunning,
  FaSearch,
  FaSort,
  FaCalendarAlt,
  FaMapMarkedAlt,
  FaRoute,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

// Composants d'interface utilisateur
import Sidebar from "../components/sidebars/Sidebar";
import Footer from "../components/sidebars/Footer";
import WhiteBackground from "../components/backgrounds/WhiteBackground";

// Chargement dynamique pour éviter les erreurs côté serveur
const MapWithStats = dynamic(() => import("../components/MapWithStats"), {
  ssr: false,
});
const Filter = dynamic(() => import("../components/SportFilter"), {
  ssr: false,
});

// Initialisation du client Supabase

// Interface pour les données de sortie
interface Track {
  id: string;
  name: string;
  sport: string;
  date_time: string;
  file_url: string;
}

// Composant de carte squelette pour le chargement
const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200"></div>
    <div className="p-4">
      <div className="h-5 bg-gray-200 rounded-sm w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded-sm w-1/2 mb-3"></div>
      <div className="h-3 bg-gray-200 rounded-sm w-full mb-2"></div>
      <div className="h-3 bg-gray-200 rounded-sm w-5/6"></div>
    </div>
  </div>
);

// Badge pour les types de sport
const SportBadge = ({ sport }: { sport: string }) => {
  const sportColors: Record<string, string> = {
    canicross: "bg-green-100 text-green-800 border-green-300",
    canimarche: "bg-blue-100 text-blue-800 border-blue-300",
    canivtt: "bg-red-100 text-red-800 border-red-300",
    balade: "bg-purple-100 text-purple-800 border-purple-300",
    default: "bg-gray-100 text-gray-800 border-gray-300",
  };

  const sportIcons: Record<string, React.ReactElement> = {
    canicross: <FaRunning className="mr-1" />,
    canimarche: <FaRoute className="mr-1" />,
    canivtt: <FaMapMarkedAlt className="mr-1" />,
    balade: <FaCalendarAlt className="mr-1" />,
  };

  const colorClass = sportColors[sport.toLowerCase()] || sportColors.default;
  const icon = sportIcons[sport.toLowerCase()] || null;

  // Ajout du préfixe "cani" s'il n'est pas déjà présent
  const displayName = sport.toLowerCase().startsWith("Cani")
    ? sport
    : `Cani-${sport}`;

  return (
    <span
      className={`inline-flex items-center text-xs px-2 py-1 rounded-full border ${colorClass}`}
    >
      {icon}
      {displayName}
    </span>
  );
};

const SortiesPage = () => {
  // États pour les données et filtres
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Stats globales
  const [stats, setStats] = useState({
    total: 0,
    sportCounts: {} as Record<string, number>,
  });

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6); // 6 éléments par page

  // Chargement des données
  useEffect(() => {
    const fetchTracks = async () => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase.rpc("get_gpx_tracks_geojson");

        if (error) {
          console.error("❌ Erreur de récupération :", error);
          return;
        }

        if (!data || data.length === 0) {
          console.error("❌ Aucune sortie trouvée !");
          return;
        }

        // Trier les sorties par date (plus récentes d'abord)
        const sortedTracks = data.sort(
          (a: Track, b: Track) =>
            new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
        );

        setTracks(sortedTracks);

        // Calculer les statistiques
        const sportCounts = sortedTracks.reduce(
          (acc: Record<string, number>, track: Track) => {
            acc[track.sport] = (acc[track.sport] || 0) + 1;
            return acc;
          },
          {}
        );

        setStats({
          total: sortedTracks.length,
          sportCounts,
        });
      } catch (err) {
        console.error("Erreur inattendue:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTracks();
  }, []);

  // Réinitialiser la pagination quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSport, searchQuery, sortOrder]);

  // Fonction pour gérer les changements de filtre de sport
  const handleSportFilter = (sport: string | null) => {
    setSelectedSport(sport);
  };

  // Application des filtres et du tri
  const filteredAndSortedTracks = useMemo(() => {
    let filtered = tracks;

    // Appliquer le filtre de sport
    if (selectedSport) {
      filtered = filtered.filter((track) => track.sport === selectedSport);
    }

    // Appliquer la recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((track) =>
        track.name.toLowerCase().includes(query)
      );
    }

    // Appliquer le tri
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.date_time).getTime();
      const dateB = new Date(b.date_time).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [tracks, selectedSport, searchQuery, sortOrder]);

  // Calcul de la pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedTracks.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredAndSortedTracks.length / itemsPerPage);

  // Fonction de pagination à corriger
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);

    // Version corrigée avec vérification stricte
    const listElement = document.getElementById("tracks-list");
    window.scrollTo({
      top: listElement ? listElement.offsetTop - 100 : 0,
      behavior: "smooth",
    });
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      paginate(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      paginate(currentPage - 1);
    }
  };

  // Composant de pagination
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPageNumbersToShow = 5;

    let startPage = Math.max(
      1,
      currentPage - Math.floor(maxPageNumbersToShow / 2)
    );
    const endPage = Math.min(totalPages, startPage + maxPageNumbersToShow - 1);

    if (endPage - startPage + 1 < maxPageNumbersToShow) {
      startPage = Math.max(1, endPage - maxPageNumbersToShow + 1);
    }

    // Première page et ellipsis
    if (startPage > 1) {
      pageNumbers.push(
        <button
          key="first"
          onClick={() => paginate(1)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-700 bg-gray-100 hover:bg-gray-200"
        >
          1
        </button>
      );

      if (startPage > 2) {
        pageNumbers.push(
          <span key="start-ellipsis" className="px-1 text-gray-500">
            ...
          </span>
        );
      }
    }

    // Pages centrales
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => paginate(i)}
          className={`w-9 h-9 rounded-full flex items-center justify-center ${
            i === currentPage
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          aria-current={i === currentPage ? "page" : undefined}
        >
          {i}
        </button>
      );
    }

    // Dernière page et ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(
          <span key="end-ellipsis" className="px-1 text-gray-500">
            ...
          </span>
        );
      }

      pageNumbers.push(
        <button
          key="last"
          onClick={() => paginate(totalPages)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-700 bg-gray-100 hover:bg-gray-200"
        >
          {totalPages}
        </button>
      );
    }

    return (
      <div className="flex justify-center mt-10 mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              currentPage === 1
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-gray-700 bg-gray-100 hover:bg-gray-200"
            }`}
            aria-label="Page précédente"
          >
            <FaChevronLeft className="w-4 h-4" />
          </button>

          <div className="hidden sm:flex items-center space-x-2">
            {pageNumbers}
          </div>

          <div className="sm:hidden flex items-center space-x-1">
            <span className="text-sm text-gray-500">
              Page {currentPage} sur {totalPages}
            </span>
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              currentPage === totalPages
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-gray-700 bg-gray-100 hover:bg-gray-200"
            }`}
            aria-label="Page suivante"
          >
            <FaChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Fonction pour formater la date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Sidebar />
      <WhiteBackground>
        <div className="grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-2">
              Sorties canines
            </h1>
            <p className="text-gray-600 mb-8">
              Explorez les parcours réalisés par notre communauté
            </p>
          </motion.div>

          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white rounded-lg shadow-xs p-4 border border-gray-100"
            >
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Total des sorties
              </h3>
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            </motion.div>

            {/* Stats par type de sport */}
            {Object.entries(stats.sportCounts).map(([sport, count], index) => (
              <motion.div
                key={sport}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
                className="bg-white rounded-lg shadow-xs p-4 border border-gray-100"
              >
                <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center">
                  <SportBadge sport={sport} />
                </h3>
                <p className="text-3xl font-bold text-blue-600">{count}</p>
              </motion.div>
            ))}
          </div>

          {/* Barre de recherche et filtres */}
          <div className="bg-white rounded-lg shadow-xs border border-gray-100 p-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Recherche */}
              <div className="relative grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher par nom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filtre de sport */}
              <div className="min-w-[200px]">
                <Filter
                  selectedSport={selectedSport}
                  onSportChange={handleSportFilter}
                />
              </div>

              {/* Ordre de tri */}
              <div className="w-full md:w-auto"></div>
            </div>
          </div>

          {/* Résultats */}
          <div className="mb-4 flex justify-between items-center">
            <p className="text-gray-600">
              {filteredAndSortedTracks.length === 0
                ? "Aucune sortie trouvée"
                : `${filteredAndSortedTracks.length} sortie${filteredAndSortedTracks.length > 1 ? "s" : ""} trouvée${filteredAndSortedTracks.length > 1 ? "s" : ""}`}
            </p>

            {/* Sélecteur d'éléments par page */}
            {filteredAndSortedTracks.length > itemsPerPage && (
              <div className="flex items-center gap-2">
                <label htmlFor="itemsPerPage" className="text-sm text-gray-500">
                  Sorties par page :
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-md text-sm p-1 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                </select>
              </div>
            )}
          </div>

          {/* Liste des sorties */}
          <div id="tracks-list">
            <AnimatePresence>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(itemsPerPage)].map((_, index) => (
                    <SkeletonCard key={index} />
                  ))}
                </div>
              ) : filteredAndSortedTracks.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentItems.map((track, index) => (
                      <motion.div
                        key={track.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                          duration: 0.3,
                          delay: (index % 6) * 0.05,
                        }}
                        className="relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="absolute top-2 right-2 z-10">
                          <SportBadge sport={track.sport} />
                        </div>
                        <MapWithStats trackData={track} />
                        <div className="p-4">
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">
                            {track.name || "Sortie sans nom"}
                          </h3>
                          <p className="text-gray-600 text-sm flex items-center">
                            <FaCalendarAlt className="mr-1" size={14} />
                            {formatDate(track.date_time)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Composant pagination */}
                  <Pagination />
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 bg-white rounded-lg shadow-xs border border-gray-100"
                >
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
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    Aucune sortie trouvée
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {selectedSport || searchQuery
                      ? "Aucune sortie ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                      : "Il n'y a actuellement aucune sortie enregistrée."}
                  </p>
                  {(selectedSport || searchQuery) && (
                    <button
                      onClick={() => {
                        setSelectedSport(null);
                        setSearchQuery("");
                      }}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-xs text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Réinitialiser les filtres
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </WhiteBackground>
      <Footer />
    </div>
  );
};

export default SortiesPage;
