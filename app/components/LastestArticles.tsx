"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import Image from "next/image";
import { motion } from "framer-motion";

interface Article {
  id: string;
  titre: string;
  contenu: string;
  image_url: string;
  created_at: string;
}

const LastestArticles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("publication")
          .select("id, titre, contenu, image_url, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          throw error;
        }

        setArticles(data || []);
        setError(null);
      } catch (err: any) {
        console.error("Erreur lors de la récupération des articles :", err);
        setError(err.message || "Erreur lors du chargement des articles");
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const handleGoToArticles = () => {
    router.push("/articles");
  };

  const handleReadMore = (id: string) => {
    router.push(`/articles/${id}`);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric"
    };
    return new Date(dateString).toLocaleDateString("fr-FR", options);
  };

  // Variants pour les animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            Nos derniers articles
          </h2>
          <div className="w-20 h-1 bg-blue-600 rounded-sm mb-4"></div>
          <p className="text-gray-600 max-w-2xl">
            Découvrez les actualités, conseils et événements de notre communauté canine
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-5">
                  <div className="h-6 bg-gray-200 rounded-sm w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded-sm w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded-sm w-5/6 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded-sm w-1/4 mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <div className="text-red-500 mb-4 text-xl">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-lg mb-2">Impossible de charger les articles</h3>
            <p className="text-gray-500">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {articles.map((article) => (
              <motion.div
                key={article.id}
                className="bg-white rounded-xl shadow-xs overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 h-full flex flex-col"
                variants={itemVariants}
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={article.image_url}
                    alt={article.titre}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    priority={false}
                  />
                </div>
                <div className="p-5 grow flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 hover:text-blue-700 transition-colors cursor-pointer" onClick={() => handleReadMore(article.id)}>
                    {article.titre}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4 grow">
                     {article.contenu.slice(0, 150)}...
                  </p>
                  <div className="mt-auto">
                    <p className="text-xs text-gray-500 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(article.created_at)}
                    </p>
                    <button
                      onClick={() => handleReadMore(article.id)}
                      className="text-sm font-medium text-blue-700 flex items-center gap-1 hover:text-blue-900 transition-colors group"
                      aria-label={`Lire l'article: ${article.titre}`}
                    >
                      Lire plus 
                      <span className="transform group-hover:translate-x-1 transition-transform duration-200">➔</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Carte bouton "Plus d'articles" */}
            <motion.div 
              className="bg-linear-to-br from-blue-800 to-blue-900 rounded-xl shadow-md overflow-hidden flex items-center justify-center h-full min-h-[320px]"
              variants={itemVariants}
            >
              <div className="text-center p-8">
                <div className="mb-4">
                  <svg className="w-12 h-12 mx-auto text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Découvrez plus d&apos;articles</h3>
                <p className="text-blue-100 mb-6">Explorez notre bibliothèque complète d&apos;articles et de conseils</p>
                <button
                  onClick={handleGoToArticles}
                  className="bg-white text-blue-900 px-6 py-3 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-md hover:shadow-lg mx-auto"
                >
                  Tous les articles 
                  <span className="transform transition-transform group-hover:translate-x-1">➔</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default LastestArticles;
