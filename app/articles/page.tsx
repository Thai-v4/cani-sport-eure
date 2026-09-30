"use client"; // Indique que ce composant s'exécute côté client

import { useState, useEffect } from "react"; // Hooks React pour l'état et les effets
import { useRouter } from "next/navigation"; // Navigation entre pages
import { SearchBar, DateFilter } from "../components/ArticlesComponents"; // Composants pour les filtres
import Sidebar from "../components/sidebars/Sidebar"; // Barre latérale
import Footer from "../components/sidebars/Footer"; // Pied de page
import Image from "next/image"; // Composant d'image optimisé
import supabase from "@/lib/supabaseClient"; // Client Supabase
import WhiteBackground from "../components/backgrounds/WhiteBackground"; // Fond blanc pour le contenu

// Définition du type d'article
interface Article {
  id: string;
  title: string;
  content: string;
  image_url: string;
  date: string;
  id_profil: string;
}

const ArticlesPage = () => {
  const [articles, setArticles] = useState<Article[]>([]); // État pour stocker les articles
  const [searchQuery, setSearchQuery] = useState<string>(""); // Terme de recherche
  const [startDate, setStartDate] = useState<string>(""); // Date de début pour filtrage
  const [endDate, setEndDate] = useState<string>(""); // Date de fin pour filtrage

  // Récupération des articles depuis Supabase au chargement
  useEffect(() => {
    const fetchArticles = async () => {
      const { data, error } = await supabase
        .from("publication")
        .select("id, titre, contenu, image_url, created_at, id_profil")
        .order("created_at", { ascending: false }); // Tri par date décroissante

      if (error) {
        console.error("Erreur lors de la récupération des articles:", error);
      } else {
        // Transformation des données pour correspondre à notre interface
        setArticles(
          data.map((article) => ({
            id: article.id,
            title: article.titre,
            content: article.contenu,
            image_url: article.image_url,
            date: article.created_at,
            id_profil: article.id_profil,
          }))
        );
      }
    };
    fetchArticles();
  }, []); // Exécuté une seule fois au chargement

  // Application des filtres (recherche et dates)
  const filteredArticles = articles.filter((article) => {
    return (
      (!searchQuery ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!startDate || article.date >= startDate) &&
      (!endDate || article.date <= endDate)
    );
  });

  const router = useRouter(); // Hook pour la navigation

  // Navigation vers la page détaillée d'un article
  const handleClick = (id: string) => {
    router.push(`/articles/${id}`);
  };

  return (
    <div>
      <Sidebar /> {/* Barre latérale de navigation */}
      <WhiteBackground>
        {" "}
        {/* Fond blanc pour le contenu */}
        <div className="min-h-screen px-10 py-6">
          {/* Titre principal */}
          <div className="text-left">
            <h1 className="primary_title_blue text-4xl font-bold text-black mb-6">
              Articles
            </h1>
          </div>

          {/* Barre de recherche et filtres de date */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8 px-4">
            <div className="w-full md:w-1/2">
              <SearchBar setSearchQuery={setSearchQuery} />
            </div>
            <div className="flex gap-4">
              <DateFilter setStartDate={setStartDate} setEndDate={setEndDate} />
            </div>
          </div>

          {/* Liste des articles avec défilement */}
          <div className="max-w-6xl mx-auto max-h-[700px] overflow-y-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white shadow-lg rounded-2xl p-4 max-w-xs relative"
                >
                  {/* Image de l'article */}
                  <Image
                    src={article.image_url}
                    alt={article.title}
                    className="rounded-xl w-full h-40 object-cover"
                    width={800}
                    height={800}
                  />
                  {/* Titre de l'article */}
                  <h3 className="text-lg font-bold mt-2">{article.title}</h3>
                  {/* Extrait du contenu */}
                  <p className="text-sm text-gray-600">
                    {article.content.slice(0, 100)}...
                  </p>
                  {/* Date de publication */}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(article.date).toLocaleDateString()}
                  </p>
                  {/* Bouton pour lire l'article complet */}
                  <button
                    onClick={() => handleClick(article.id)}
                    className="text-blue-500"
                  >
                    Lire plus →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </WhiteBackground>
      <Footer /> {/* Pied de page */}
    </div>
  );
};

export default ArticlesPage;
