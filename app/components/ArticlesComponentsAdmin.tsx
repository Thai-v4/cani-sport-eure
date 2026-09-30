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
  user_name: string;
  user_avatar: string;
}

const timeSince = (date: string) => {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return `Il y a ${seconds} secondes`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} heures`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} jours`;
};

interface SearchBarProps {
  setSearchQuery: (query: string) => void;
}

interface DateFilterProps {
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
}

// Composant pour une carte d'article
const ArticleCardAdmin: React.FC<{
  article: Article;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}> = ({ article, onDelete, onEdit }) => {
  return (
    <div className="bg-white rounded-2xl p-4 relative border border-rule">
      {/* Section utilisateur */}
      <div className="flex items-center space-x-3 mb-3">
        <Image
          src={article.user_avatar}
          alt={article.user_name}
          className="w-10 h-10 rounded-full"
          width={800}
          height={800}
        />
        <div>
          <p className="font-semibold">{article.user_name}</p>
          <p className="text-xs text-gray-500">{timeSince(article.date)}</p>
        </div>
      </div>

      {/* Icônes d'édition et suppression */}
      <div className="absolute top-2 right-2 flex space-x-2">
        <button onClick={() => onDelete(article.id)} className="text-red-500">
          <X size={20} />
        </button>
        <button onClick={() => onEdit(article.id)} className="text-blue-500">
          <Edit size={20} />
        </button>
      </div>

      {/* Image de l'article */}
      <Image
        src={article.image_url}
        alt={article.title}
        className="rounded-xl w-full h-80 object-cover"
        width={800}
        height={800}
      />

      {/* Contenu de l'article */}
      <p className="text-xs text-gray-500 mt-2">
        Créé le {new Date(article.date).toLocaleDateString()}
      </p>
      <h3 className="text-lg font-bold mt-2">{article.title}</h3>
      <p className="text-sm text-gray-600">
        {article.content.slice(0, 100)}...
      </p>
    </div>
  );
};
// Barre de recherche
const SearchBar: React.FC<SearchBarProps> = ({ setSearchQuery }) => {
  return (
    <input
      type="text"
      placeholder="Rechercher un article..."
      className="p-2 border rounded-lg w-full"
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  );
};

// Filtre de date
const DateFilter: React.FC<DateFilterProps> = ({
  setStartDate,
  setEndDate,
}) => {
  return (
    <div className="flex space-x-2">
      <input
        type="date"
        className="p-2 border rounded-lg"
        onChange={(e) => setStartDate(e.target.value)}
      />
      <input
        type="date"
        className="p-2 border rounded-lg"
        onChange={(e) => setEndDate(e.target.value)}
      />
    </div>
  );
};

export { ArticleCardAdmin, SearchBar, DateFilter };
