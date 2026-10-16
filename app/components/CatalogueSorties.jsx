"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FaTrash,
  FaPlus,
  FaEdit,
  FaUpload,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFilter,
  FaFileDownload,
  FaMapMarkedAlt,
  FaRunning,
  FaCalendarAlt,
  FaClock,
} from "react-icons/fa";
import supabase from "@/lib/supabaseClient"; // Client Supabase
import ModalAdd from "./ModalAdd";
import ModalEdit from "./ModalEdit";
import ModalConfirm from "./ModalConfirm";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";

export default function CatalogueSorties({ isModalOpen, setIsModalOpen }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSortie, setSelectedSortie] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSortieId, setSelectedSortieId] = useState(null);
  const [notification, setNotification] = useState(null);

  // États pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // États pour le tri
  const [sortConfig, setSortConfig] = useState({
    key: "date_time",
    direction: "desc",
  });

  // Catégories disponibles (extraites des données)
  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(data.map((sortie) => sortie.categorie)),
    ];
    return uniqueCategories;
  }, [data]);

  // Fonction pour afficher les notifications
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Charger les sorties depuis Supabase
  useEffect(() => {
    const fetchSorties = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("gpx_tracks")
          .select("id, name, sport, date_time, file_url");

        if (error) {
          console.error("❌ Erreur de récupération :", error);
          showNotification("Erreur lors du chargement des sorties", "error");
        } else {
          const formattedData = data.map((sortie) => ({
            id: sortie.id,
            titre: sortie.name,
            categorie: sortie.sport,
            date: format(new Date(sortie.date_time), "PPP", { locale: fr }),
            heure: format(new Date(sortie.date_time), "HH:mm", { locale: fr }),
            date_time: sortie.date_time,
            file_url: sortie.file_url,
          }));

          setData(formattedData);
        }
      } catch (error) {
        console.error("❌ Exception :", error);
        showNotification("Une erreur est survenue", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchSorties();
  }, []);

  // Fonction pour supprimer une sortie
  const handleDeleteClick = (id) => {
    setSelectedSortieId(id);
    setIsDeleteModalOpen(true);
  };

  // Fonction pour confirmer la suppression
  const confirmDelete = async () => {
    if (!selectedSortieId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("gpx_tracks")
        .delete()
        .match({ id: selectedSortieId });

      if (error) {
        console.error("❌ Erreur de suppression :", error);
        showNotification("Erreur lors de la suppression", "error");
      } else {
        setData(data.filter((sortie) => sortie.id !== selectedSortieId));
        showNotification("Sortie supprimée avec succès");
      }
    } catch (error) {
      console.error("❌ Exception :", error);
      showNotification("Une erreur est survenue", "error");
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setSelectedSortieId(null);
    }
  };

  // Fonction pour ouvrir le modal d'édition
  const handleEditClick = (sortie) => {
    setSelectedSortie(sortie);
    setIsEditModalOpen(true);
  };

  // Fonction pour gérer la réussite de l'ajout
  const handleAddSuccess = (newSortie) => {
    const formattedSortie = {
      id: newSortie.id,
      titre: newSortie.name,
      categorie: newSortie.sport,
      date: format(new Date(newSortie.date_time), "PPP", { locale: fr }),
      heure: format(new Date(newSortie.date_time), "HH:mm", { locale: fr }),
      date_time: newSortie.date_time,
      file_url: newSortie.file_url,
    };

    setData((prevData) => [...prevData, formattedSortie]);
    showNotification("Nouvelle sortie ajoutée avec succès");
  };

  // Fonction pour gérer la réussite de l'édition
  const handleEditSuccess = (updatedSortie) => {
    const formattedSortie = {
      id: updatedSortie.id,
      titre: updatedSortie.name,
      categorie: updatedSortie.sport,
      date: format(new Date(updatedSortie.date_time), "PPP", { locale: fr }),
      heure: format(new Date(updatedSortie.date_time), "HH:mm", { locale: fr }),
      date_time: updatedSortie.date_time,
      file_url: updatedSortie.file_url,
    };

    setData((prevData) =>
      prevData.map((sortie) =>
        sortie.id === updatedSortie.id ? formattedSortie : sortie
      )
    );

    showNotification("Sortie modifiée avec succès");
  };

  // Fonction pour trier les données
  const handleSort = (key) => {
    let direction = "asc";

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });
  };

  // Appliquer le tri, le filtre et la recherche aux données
  const processedData = useMemo(() => {
    // Créer une copie des données pour le traitement
    let result = [...data];

    // Appliquer le filtre par catégorie
    if (filterType !== "all") {
      result = result.filter((sortie) => sortie.categorie === filterType);
    }

    // Appliquer la recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (sortie) =>
          sortie.titre.toLowerCase().includes(searchLower) ||
          sortie.categorie.toLowerCase().includes(searchLower) ||
          sortie.date.toLowerCase().includes(searchLower)
      );
    }

    // Appliquer le tri
    result.sort((a, b) => {
      if (sortConfig.key === "date_time") {
        // Tri par date/heure
        const dateA = new Date(a[sortConfig.key]);
        const dateB = new Date(b[sortConfig.key]);

        if (sortConfig.direction === "asc") {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      } else {
        // Tri alphabétique pour les autres colonnes
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      }
    });

    return result;
  }, [data, filterType, searchTerm, sortConfig]);

  // Obtenir l'icône de tri pour une colonne donnée
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort className="inline ml-1 text-gray-400" />;
    }

    return sortConfig.direction === "asc" ? (
      <FaSortUp className="inline ml-1 text-blue-600" />
    ) : (
      <FaSortDown className="inline ml-1 text-blue-600" />
    );
  };

  // Fonction pour obtenir la classe du badge de catégorie
  const getCategoryBadgeClass = (category) => {
    const baseClass = "text-xs font-medium px-2.5 py-0.5 rounded-full";

    switch (category.toLowerCase()) {
      case "canimarche":
        return `${baseClass} bg-green-100 text-green-800`;
      case "canicross":
        return `${baseClass} bg-blue-100 text-blue-800`;
      case "canivtt":
        return `${baseClass} bg-orange-100 text-orange-800`;
      case "canipédicycle":
        return `${baseClass} bg-purple-100 text-purple-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="w-full overflow-hidden bg-paper">
      {/* Header avec titre et actions */}
      <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="display text-3xl md:text-4xl">
          Sorties
        </h1>

        <div className="flex items-center gap-2 sm:gap-4 self-end sm:self-auto">
          {/* Barre de recherche */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 pr-3 py-2 w-40 sm:w-60 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Effacer</span>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Filtre par catégorie */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <FaFilter
                className={`mr-2 ${filterType !== "all" ? "text-blue-600" : "text-gray-400"}`}
              />
              {filterType === "all" ? "Filtrer" : filterType}
            </button>

            {isFilterOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md bg-white ring-1 ring-black ring-opacity-5 z-10 border border-rule">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    onClick={() => {
                      setFilterType("all");
                      setIsFilterOpen(false);
                    }}
                    className={`block px-4 py-2 text-sm w-full text-left ${ filterType === "all" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-50" }`}
                    role="menuitem"
                  >
                    Toutes les catégories
                  </button>

                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setFilterType(category);
                        setIsFilterOpen(false);
                      }}
                      className={`block px-4 py-2 text-sm w-full text-left ${ filterType === category ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-50" }`}
                      role="menuitem"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu du tableau */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Chargement des sorties...</p>
          </div>
        ) : processedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            {searchTerm || filterType !== "all" ? (
              <>
                <FaSearch className="text-gray-400 text-4xl mb-3" />
                <h3 className="text-lg font-medium text-gray-700">
                  Aucune sortie trouvée
                </h3>
                <p className="text-gray-500 mt-1">
                  Essayez d'autres termes de recherche ou filtres
                </p>
                <div className="mt-4 flex space-x-2">
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      Effacer la recherche
                    </button>
                  )}
                  {filterType !== "all" && (
                    <button
                      onClick={() => setFilterType("all")}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      Réinitialiser le filtre
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <FaMapMarkedAlt className="text-gray-400 text-4xl mb-3" />
                <h3 className="text-lg font-medium text-gray-700">
                  Aucune sortie disponible
                </h3>
                <p className="text-gray-500 mt-1">
                  Ajoutez votre première sortie pour commencer
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <FaPlus className="mr-2" /> Ajouter une sortie
                </button>
              </>
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3.5 text-left text-sm font-semibold text-gray-600 cursor-pointer"
                  onClick={() => handleSort("titre")}
                >
                  <div className="flex items-center">
                    Titre {getSortIcon("titre")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3.5 text-left text-sm font-semibold text-gray-600 cursor-pointer"
                  onClick={() => handleSort("categorie")}
                >
                  <div className="flex items-center">
                    Catégorie {getSortIcon("categorie")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3.5 text-left text-sm font-semibold text-gray-600 cursor-pointer"
                  onClick={() => handleSort("date_time")}
                >
                  <div className="flex items-center">
                    Date & Heure {getSortIcon("date_time")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3.5 text-center text-sm font-semibold text-gray-600"
                >
                  Fichier GPX
                </th>
                <th
                  scope="col"
                  className="px-4 py-3.5 text-center text-sm font-semibold text-gray-600"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedData.map((sortie) => (
                <motion.tr
                  key={sortie.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-800">
                      {sortie.titre}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={getCategoryBadgeClass(sortie.categorie)}>
                      <FaRunning className="inline mr-1 text-xs" />{" "}
                      {sortie.categorie}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-700">
                      <span className="flex items-center">
                        <FaCalendarAlt className="text-gray-400 mr-1.5" />{" "}
                        {sortie.date}
                      </span>
                      <span className="sm:ml-4 flex items-center mt-1 sm:mt-0">
                        <FaClock className="text-gray-400 mr-1.5" />{" "}
                        {sortie.heure}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    {sortie.file_url ? (
                      <a
                        href={sortie.file_url}
                        download
                        className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                      >
                        <FaFileDownload className="mr-1.5" /> Télécharger
                      </a>
                    ) : (
                      <span className="text-sm text-gray-500">
                        Non disponible
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={() => handleEditClick(sortie)}
                        className="text-sky-600 hover:text-sky-900 transition-colors p-1 hover:bg-sky-50 rounded-sm"
                        title="Modifier"
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(sortie.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded-sm"
                        title="Supprimer"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg z-50 flex items-center ${ notification.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white" }`}
          >
            {notification.type === "success" ? (
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmation */}
      <ModalConfirm
        isOpen={isDeleteModalOpen}
        title="Supprimer cette sortie ?"
        message="Cette action est irréversible. Êtes-vous sûr de vouloir supprimer cette sortie ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* Modal d'ajout */}
      <ModalAdd
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddSuccess={handleAddSuccess}
      />

      {/* Modal d'édition */}
      <ModalEdit
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        sortie={selectedSortie}
        onEditSuccess={handleEditSuccess}
      />
    </div>
  );
}
