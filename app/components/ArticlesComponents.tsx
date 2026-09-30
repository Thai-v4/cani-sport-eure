"use client";

import { Link, X, Edit } from "lucide-react";
import Image from "next/image";

interface Article {
  id: string;
  title: string;
  content: string;
  image_url: string;
  date: string;
  id_profil: string;
}

interface SearchBarProps {
  setSearchQuery: (query: string) => void;
  placeholder?: string;
}

interface DateFilterProps {
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
}

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

interface EmptyStateProps {
  searchQuery?: string;
}

// Composant ArticleCard
const ArticleCard: React.FC<{
  article: Article;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}> = ({ article, onDelete, onEdit }) => {
  return (
    <div className="bg-white shadow-lg rounded-2xl overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-xl">
      <div className="relative">
        <Image
          src={article.image_url}
          alt={article.title}
          className="w-full h-48 object-cover"
          width={800}
          height={800}
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              onEdit(article.id);
            }}
            className="bg-white p-1.5 rounded-full shadow-md hover:bg-blue-50"
          >
            <Edit size={16} className="text-blue-600" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete(article.id);
            }}
            className="bg-white p-1.5 rounded-full shadow-md hover:bg-red-50"
          >
            <X size={16} className="text-red-600" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 bg-linear-to-t from-black/70 to-transparent w-full h-16"></div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center">
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
            {new Date(article.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>

        <h3 className="text-lg font-bold mt-2 line-clamp-2">{article.title}</h3>
        <p className="text-sm text-gray-600 mt-2 line-clamp-3">
          {article.content}
        </p>

        <a
          href={`/articles/${article.id}`}
          className="inline-flex items-center mt-3 text-blue-600 font-medium hover:text-blue-800 group"
        >
          Lire plus
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </div>
    </div>
  );
};

// Barre de recherche
const SearchBar: React.FC<SearchBarProps> = ({ setSearchQuery, placeholder = "Rechercher un article..." }) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        placeholder={placeholder}
        className="bg-white pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg w-full focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
};

// Filtre de date
const DateFilter: React.FC<DateFilterProps> = ({ setStartDate, setEndDate }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
      <div className="flex items-center">
        <label className="block text-sm font-medium text-gray-700 mr-2">
          Du
        </label>
        <input
          type="date"
          className="bg-white p-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
      <div className="flex items-center">
        <label className="block text-sm font-medium text-gray-700 mr-2">
          au
        </label>
        <input
          type="date"
          className="bg-white p-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
    </div>
  );
};

// Pagination
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    let startPage = Math.max(currentPage - 2, 1);
    const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(endPage - maxVisiblePages + 1, 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push("ellipsis-start");
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push("ellipsis-end");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex justify-center items-center my-8 space-x-2">
      <button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded-md ${
          currentPage === 1
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
        aria-label="Page précédente"
      >
        &laquo;
      </button>

      {pageNumbers.map((page, index) => {
        if (page === "ellipsis-start" || page === "ellipsis-end") {
          return (
            <span key={`${page}-${index}`} className="px-3 py-1">
              ...
            </span>
          );
        }

        return (
          <button
            key={index}
            onClick={() => typeof page === "number" && onPageChange(page)}
            className={`px-3 py-1 rounded-md ${
              currentPage === page
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
        className={`px-3 py-1 rounded-md ${
          currentPage === totalPages || totalPages === 0
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
        aria-label="Page suivante"
      >
        &raquo;
      </button>
    </div>
  );
};

// Skeleton pour le chargement
const ArticleSkeleton: React.FC = () => (
  <div className="bg-white shadow-md rounded-2xl overflow-hidden animate-pulse">
    <div className="bg-gray-300 h-48 w-full"></div>
    <div className="p-4">
      <div className="h-4 bg-gray-300 rounded-sm w-1/4 mb-3"></div>
      <div className="h-6 bg-gray-300 rounded-sm w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-300 rounded-sm w-full mb-2"></div>
      <div className="h-4 bg-gray-300 rounded-sm w-full mb-2"></div>
      <div className="h-4 bg-gray-300 rounded-sm w-2/3"></div>
    </div>
  </div>
);

// État vide
const EmptyState: React.FC<EmptyStateProps> = ({ searchQuery }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="bg-gray-100 p-5 rounded-full mb-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      Aucun article trouvé
    </h3>
    {searchQuery ? (
      <p className="text-gray-500 text-center max-w-md">
        Nous n&apos;avons trouvé aucun article correspondant à &quot;{searchQuery}&quot;. Essayez
        avec d&apos;autres termes de recherche.
      </p>
    ) : (
      <p className="text-gray-500 text-center max-w-md">
        Aucun article n&apos;est disponible pour le moment. Revenez bientôt pour
        découvrir du nouveau contenu!
      </p>
    )}
  </div>
);

// Filtre par catégories
interface FilterBarProps {
  categories: Array<{ id: string; name: string }>;
  activeCategory: string;
  setCategory: (category: string) => void;
  setSortBy: (sortBy: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ categories, activeCategory, setCategory, setSortBy }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-3 rounded-lg shadow-xs mb-6">
      <div className="flex flex-wrap gap-2 mb-3 md:mb-0">
        <button 
          onClick={() => setCategory("all")}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
            ${activeCategory === "all" 
              ? "bg-blue-600 text-white" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          Tous
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
              ${activeCategory === cat.id 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            {cat.name}
          </button>
        ))}
      </div>
      
      <select
        onChange={(e) => setSortBy(e.target.value)}
        className="bg-white border border-gray-300 rounded-lg p-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
      >
        <option value="recent">Plus récents</option>
        <option value="oldest">Plus anciens</option>
        <option value="az">A-Z</option>
        <option value="za">Z-A</option>
      </select>
    </div>
  );
};

// Export de tous les composants
export {
  ArticleCard,
  SearchBar,
  DateFilter,
  Pagination,
  ArticleSkeleton,
  EmptyState,
  FilterBar
};
