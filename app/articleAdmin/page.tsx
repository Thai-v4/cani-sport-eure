"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArticleCardAdmin } from "../components/ArticlesComponentsAdmin";
import AddArticleModal from "../components/AddArticleModal";
import EditArticleModal from "../components/EditArticleModal";
import supabase from "@/lib/supabaseClient";
import SidebarAdmin from "../components/SidebarAdmin";
import ModalConfirm from "../components/ModalConfirm";
import { useAuth } from "@/app/components/Auth/AuthProvider";
import {
  FaSearch,
  FaFilter,
  FaPlus,
  FaTimes,
  FaCalendarAlt,
  FaSortAmountDown,
  FaSortAmountUp,
  FaBars,
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";

interface Article {
  id: string;
  title: string;
  content: string;
  image_url: string;
  date: string;
  id_profil: string;
  user_name: string;
  user_avatar: string;
}

const ArticlesPage: React.FC = () => {
  const { user, role, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  // États pour la gestion des articles et filtres
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<
    "newest" | "oldest" | "alphabetical"
  >("newest");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // États pour l'interface et les modales
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(
    null
  );

  // Détecter si on est sur mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Protection de la route
  useEffect(() => {
    if (!isAuthLoading && (!user || role !== "admin")) {
      router.replace("/connexion");
    }
  }, [user, role, isAuthLoading, router]);

  // Récupération des articles
  const fetchArticles = async () => {
    setIsLoadingArticles(true);
    try {
      const { data, error } = await supabase
        .from("publication")
        .select("id, titre, contenu, image_url, created_at, id_profil");

      if (error) {
        console.error("❌ Erreur lors de la récupération des articles:", error);
        showNotification("Erreur lors du chargement des articles");
        return;
      }

      // Enrichissement des articles avec les données des auteurs
      const articlesWithProfiles = await Promise.all(
        data.map(async (article) => {
          const { data: profileData } = await supabase
            .from("profils_publics")
            .select("nom, photo_profil")
            .eq("id", article.id_profil)
            .single();

          return {
            id: article.id,
            title: article.titre,
            content: article.contenu,
            image_url: article.image_url,
            date: article.created_at,
            id_profil: article.id_profil,
            user_name: profileData?.nom || "Utilisateur inconnu",
            user_avatar: profileData?.photo_profil || "/default-avatar.png",
          };
        })
      );

      setArticles(articlesWithProfiles);
    } catch (err) {
      console.error("Erreur inattendue:", err);
      showNotification("Une erreur est survenue");
    } finally {
      setIsLoadingArticles(false);
    }
  };

  useEffect(() => {
    if (user && role === "admin") fetchArticles();
  }, [user, role]);

  // Notification temporaire
  const showNotification = (message: string) => {
    setNotificationMessage(message);
    setTimeout(() => setNotificationMessage(null), 3000);
  };

  // Suppression d'un article
  const confirmDelete = (id: string) => {
    setArticleToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!articleToDelete) return;

    try {
      const { error } = await supabase
        .from("publication")
        .delete()
        .eq("id", articleToDelete);

      if (error) {
        throw new Error(error.message);
      }

      setArticles((prev) => prev.filter((a) => a.id !== articleToDelete));
      showNotification("Article supprimé avec succès");
    } catch (err) {
      console.error("Erreur de suppression:", err);
      showNotification("Échec de la suppression");
    } finally {
      setIsConfirmOpen(false);
      setArticleToDelete(null);
    }
  };

  // Édition d'un article
  const handleEdit = (id: string) => {
    setCurrentArticleId(id);
    setIsEditModalOpen(true);
  };

  // Gestion des modales
  const handleCloseModal = () => {
    setIsModalOpen(false);
    fetchArticles();
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentArticleId(null);
  };

  // Tri des articles
  const sortArticles = (articles: Article[]) => {
    switch (sortOrder) {
      case "newest":
        return [...articles].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      case "oldest":
        return [...articles].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      case "alphabetical":
        return [...articles].sort((a, b) => a.title.localeCompare(b.title));
      default:
        return articles;
    }
  };

  // Filtrage des articles
  const filteredArticles = sortArticles(
    articles.filter((article) => {
      return (
        (!searchQuery ||
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (!startDate ||
          new Date(article.date).toISOString() >=
            new Date(startDate).toISOString()) &&
        (!endDate ||
          new Date(article.date).toISOString() <=
            new Date(endDate + "T23:59:59").toISOString())
      );
    })
  );

  // Affichage vide pendant le chargement ou si non autorisé
  if (!isAuthLoading && (!user || role !== "admin")) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <div className="">
        <SidebarAdmin onAdd={() => setIsModalOpen(true)}/>
      </div>

      {/* Contenu principal - maintenant avec défilement indépendant */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="p-4 md:p-8 md:pt-16">
            <div className="max-w-7xl mx-auto">
              {/* En-tête avec titre et bouton d'ajout */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Articles
                </h1>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-xs transition-colors self-end md:self-auto"
                >
                  <FaPlus className="mr-2" />
                  <span>Nouvel article</span>
                </button>
              </div>

              {/* Barre de recherche et filtres */}
              <div className="bg-white p-4 rounded-xl shadow-xs mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Recherche */}
                  <div className="relative grow">
                    <input
                      type="text"
                      placeholder="Rechercher un article"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full py-2 pl-4 pr-10 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>

                  {/* Boutons de filtrage et tri */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                      className={`p-2 border ${
                        isFiltersOpen
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-gray-300 text-gray-700"
                      } rounded-lg hover:bg-gray-50 flex items-center`}
                      aria-expanded={isFiltersOpen}
                    >
                      <FaFilter className="mr-1" />
                      <span>Filtres</span>
                    </button>

                    <button
                      onClick={() =>
                        setSortOrder((prev) =>
                          prev === "newest"
                            ? "oldest"
                            : prev === "oldest"
                              ? "alphabetical"
                              : "newest"
                        )
                      }
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 flex items-center"
                      title={`Tri: ${
                        sortOrder === "newest"
                          ? "Plus récents"
                          : sortOrder === "oldest"
                            ? "Plus anciens"
                            : "Alphabétique"
                      }`}
                    >
                      {sortOrder === "newest" ? (
                        <>
                          <FaSortAmountDown className="mr-1" />{" "}
                          <span>Plus récent</span>
                        </>
                      ) : sortOrder === "oldest" ? (
                        <>
                          <FaSortAmountUp className="mr-1" />{" "}
                          <span>Plus ancien</span>
                        </>
                      ) : (
                        <>
                          <FaSortAmountDown className="mr-1" /> <span>A-Z</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Filtres étendus */}
                <AnimatePresence>
                  {isFiltersOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 mt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FaCalendarAlt className="inline mr-1" /> Date de
                            début
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FaCalendarAlt className="inline mr-1" /> Date de
                            fin
                          </label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Statistiques rapides */}
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
                  <span className="py-1 px-2 bg-blue-50 rounded-full">
                    Total: {articles.length}
                  </span>
                  {searchQuery && (
                    <span className="py-1 px-2 bg-blue-50 rounded-full">
                      Résultats: {filteredArticles.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Contenu principal - Affichage des articles */}
              <div className="relative min-h-[400px]">
                {isLoadingArticles ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600">
                      Chargement des articles...
                    </p>
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-xs p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaSearch className="text-gray-400 text-xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      Aucun article trouvé
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery || startDate || endDate
                        ? "Aucun article ne correspond à vos critères de recherche."
                        : "Commencez par créer votre premier article."}
                    </p>
                    {!searchQuery && !startDate && !endDate && (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <FaPlus className="mr-2" /> Créer un article
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredArticles.map((article) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ArticleCardAdmin
                          article={article}
                          onDelete={() => confirmDelete(article.id)}
                          onEdit={() => handleEdit(article.id)}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Notification */}
      <AnimatePresence>
        {notificationMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            {notificationMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modales */}
      <ModalConfirm
        isOpen={isConfirmOpen}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />

      <AddArticleModal isOpen={isModalOpen} onClose={handleCloseModal} />

      {isEditModalOpen && currentArticleId && (
        <EditArticleModal
          isOpen={isEditModalOpen}
          articleId={currentArticleId}
          onClose={handleCloseEditModal}
          onUpdate={() => {
            handleCloseEditModal();
            fetchArticles();
            showNotification("Article mis à jour avec succès");
          }}
        />
      )}
    </div>
  );
};

export default ArticlesPage;
