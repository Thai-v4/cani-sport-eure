"use client";

import { useEffect, useState } from "react";
import {
  FaTrash,
  FaEye,
  FaUpload,
  FaSort,
  FaFolderOpen,
  FaFolder,
  FaChevronRight,
  FaPlus,
  FaTimes,
  FaDownload,
  FaBars,
  FaSearch,
  FaListUl,
  FaTh,
  FaArrowLeft,
  FaEllipsisV,
  FaCog,
} from "react-icons/fa";
import ModalAddDocument from "../components/ModalAddDocument";
import SidebarAdmin from "../components/SidebarAdmin";
import supabase from "@/lib/supabaseClient";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/Auth/AuthProvider";
import ModalConfirm from "../components/ModalConfirm";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Définition du type pour les fichiers et dossiers
interface DocumentFile {
  id: string;
  name: string;
  size?: string;
  type?: string;
  createdAt: string;
  updatedAt?: string;
  url?: string;
  is_folder: boolean;
  parent_id?: string | null;
}

const formatFileSize = (bytes: number | null | undefined): string => {
  if (bytes === null || bytes === undefined) return "-";

  // Conversion en différentes unités
  const kb = bytes / 1024;
  const mb = kb / 1024;
  const gb = mb / 1024;

  // Sélection de l'unité appropriée
  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  } else if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  } else if (kb >= 1) {
    return `${kb.toFixed(2)} KB`;
  } else {
    return `${bytes} octets`;
  }
};

export default function DocumentManager() {
  const { role, isLoading } = useAuth();
  const router = useRouter();

  // États existants
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderAccess, setNewFolderAccess] = useState("public");
  const [folderPath, setFolderPath] = useState<
    { id: string | null; name: string }[]
  >([{ id: null, name: "Dossier Racine" }]);
  const [newFolderName, setNewFolderName] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [fileToDeleteId, setFileToDeleteId] = useState<string | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  // Nouveaux états pour UX améliorée
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [sortType, setSortType] = useState<"name" | "date" | "size">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  const isAdmin = role === "admin";

  // Notification helper function
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const isFolderEmpty = async (folderId: string) => {
    const { data } = await supabase
      .from("club_documents")
      .select("id")
      .eq("parent_id", folderId);
    return data?.length === 0;
  };

  const handleDeleteFolder = async (folderId: string) => {
    setIsLoading2(true);
    const isEmpty = await isFolderEmpty(folderId);
    if (isEmpty) {
      const { error } = await supabase
        .from("club_documents")
        .delete()
        .eq("id", folderId);
      if (error) {
        console.error("❌ Erreur de suppression du dossier :", error);
        showNotification("Erreur lors de la suppression du dossier", "error");
      } else {
        showNotification("Dossier supprimé avec succès", "success");
        setFiles((prev) => prev.filter((f) => f.id !== folderId));
      }
    } else {
      showNotification("Impossible de supprimer un dossier non vide", "error");
    }
    setIsLoading2(false);
  };

  useEffect(() => {
    if (!isLoading && role !== "admin") {
      router.push("/connexion");
    }
  }, [role, isLoading, router]);

  useEffect(() => {
    if (isLoading) return;
    const fetchFiles = async () => {
      setIsLoading2(true);
      let query = supabase.from("club_documents").select("*");

      if (folderPath.length > 1) {
        query = query.eq("parent_id", folderPath[folderPath.length - 1].id);
      } else {
        query = query.is("parent_id", null);
      }

      const { data, error } = await query;

      if (error) {
        console.error("❌ Erreur de récupération :", error);
        showNotification("Erreur lors du chargement des fichiers", "error");
      } else {
        setFiles(
          data.map((file) => ({
            id: file.id,
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type || "Dossier",
            createdAt: file.created_at
              ? new Date(file.created_at).toLocaleString()
              : "-",
            updatedAt: file.updated_at
              ? new Date(file.updated_at).toLocaleString()
              : "-",
            url: file.file_url,
            is_folder: file.is_folder,
            parent_id: file.parent_id,
          }))
        );
      }
      setIsLoading2(false);
    };

    fetchFiles();
  }, [folderPath, isLoading]);

  const confirmDelete = (id: string, isFolder: boolean) => {
    if (isFolder) {
      isFolderEmpty(id).then((isEmpty) => {
        if (isEmpty) {
          setFileToDeleteId(id);
          setIsConfirmOpen(true);
        } else {
          showNotification(
            "Ce dossier contient des éléments et ne peut pas être supprimé",
            "error"
          );
        }
      });
    } else {
      setFileToDeleteId(id);
      setIsConfirmOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!fileToDeleteId) return;

    setIsLoading2(true);
    const fileToDelete = files.find((f) => f.id === fileToDeleteId);
    if (!fileToDelete) return;

    if (fileToDelete.is_folder) {
      await handleDeleteFolder(fileToDeleteId);
    } else {
      const { error } = await supabase
        .from("club_documents")
        .delete()
        .match({ id: fileToDeleteId });

      if (error) {
        console.error("❌ Erreur de suppression :", error);
        showNotification("Erreur lors de la suppression du fichier", "error");
      } else {
        setFiles((prev) => prev.filter((f) => f.id !== fileToDeleteId));
        showNotification("Fichier supprimé avec succès", "success");
      }
    }

    setFileToDeleteId(null);
    setIsConfirmOpen(false);
    setIsLoading2(false);
  };

  const handleUploadClick = () => {
    if (!isAdmin) {
      setIsErrorModalOpen(true);
      return;
    }
    setIsModalOpen(true);
  };

  const handleFolderClick = (folderId: string, folderName: string) => {
    setFolderPath([...folderPath, { id: folderId, name: folderName }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    setFolderPath(folderPath.slice(0, index + 1));
  };

  const handleAddFolder = async () => {
    if (!isAdmin) {
      setIsErrorModalOpen(true);
      return;
    }

    if (!newFolderName.trim()) {
      showNotification("Veuillez saisir un nom de dossier", "error");
      return;
    }

    setIsLoading2(true);
    const { data, error } = await supabase
      .from("club_documents")
      .insert([
        {
          name: newFolderName,
          is_folder: true,
          parent_id: folderPath[folderPath.length - 1].id,
          created_at: new Date().toISOString(),
          access_level: newFolderAccess,
        },
      ])
      .select();

    if (error) {
      console.error("❌ Erreur d'ajout du dossier :", error);
      showNotification("Erreur lors de la création du dossier", "error");
    } else {
      setFiles([
        ...files,
        {
          ...data[0],
          size: "-",
          type: "Dossier",
          createdAt: new Date().toLocaleString(),
        },
      ]);
      setIsFolderModalOpen(false);
      setNewFolderName("");
      setNewFolderAccess("public");
      showNotification("Dossier créé avec succès", "success");
    }
    setIsLoading2(false);
  };

  const refreshCurrentFolder = async () => {
    if (!isLoading) {
      setIsLoading2(true);
      try {
        const { data, error } = await supabase
          .from("club_documents")
          .select("*")
          .eq("parent_id", folderPath[folderPath.length - 1].id);

        if (error) {
          console.error("❌ Erreur de chargement des fichiers:", error);
          showNotification(
            "Erreur lors du rafraîchissement des fichiers",
            "error"
          );
          return;
        }

        setFiles(
          data.map((file) => ({
            id: file.id,
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type || "Dossier",
            createdAt: file.created_at
              ? new Date(file.created_at).toLocaleString()
              : "-",
            updatedAt: file.updated_at
              ? new Date(file.updated_at).toLocaleString()
              : "-",
            url: file.file_url,
            is_folder: file.is_folder,
            parent_id: file.parent_id,
          })) || []
        );

        showNotification("Fichiers mis à jour", "success");
      } catch (error) {
        console.error("❌ Exception lors du chargement des fichiers:", error);
        showNotification("Erreur inattendue", "error");
      } finally {
        setIsLoading2(false);
      }
    }
  };

  const handleDownload = async (url: string | undefined, fileName: string) => {
    if (!url) {
      showNotification("URL de téléchargement manquante", "error");
      return;
    }

    try {
      setIsLoading2(true);
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      showNotification("Téléchargement réussi", "success");
    } catch (error) {
      console.error("❌ Erreur lors du téléchargement:", error);
      showNotification("Erreur lors du téléchargement", "error");
    } finally {
      setIsLoading2(false);
    }
  };

  const getIconName = (type?: string) => {
    const t = type?.toLowerCase() || "file";
    if (["xls", "xlsx"].includes(t)) return t;
    if (["doc", "docx"].includes(t)) return t;
    if (t === "pdf") return "pdf";
    return "file";
  };

  // Fonction de filtrage et tri des fichiers
  const filteredAndSortedFiles = () => {
    // Filtrage par recherche
    let result = files;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (file) =>
          file.name.toLowerCase().includes(query) ||
          (file.type?.toLowerCase() || '').includes(query)
      );
    }

    // Tri par type (dossiers en premier)
    result = [...result].sort((a, b) => {
      // Toujours afficher les dossiers en premier
      if (a.is_folder !== b.is_folder) {
        return a.is_folder ? -1 : 1;
      }

      // Ensuite appliquer le tri sélectionné
      if (sortType === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortType === "date") {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortType === "size") {
        // Pour les dossiers où la taille est "-", on les considère comme plus petits
        if (a.size === "-" && b.size !== "-")
          return sortDirection === "asc" ? -1 : 1;
        if (a.size !== "-" && b.size === "-")
          return sortDirection === "asc" ? 1 : -1;
        if (a.size === "-" && b.size === "-") return 0;

        // Pour les vrais fichiers, comparer les tailles
        const sizeA = parseFloat(a.size?.split(" ")[0] || "0");
        const sizeB = parseFloat(b.size?.split(" ")[0] || "0");
        const unitA = a.size?.split(" ")[1];
        const unitB = b.size?.split(" ")[1];

        // Si unités différentes, classer par unité
        if (unitA !== unitB) {
          const unitOrder = ["octets", "KB", "MB", "GB"];
          return sortDirection === "asc"
            ? unitOrder.indexOf(unitA || "") - unitOrder.indexOf(unitB || "")
            : unitOrder.indexOf(unitB || "") - unitOrder.indexOf(unitA || "");
        }

        // Sinon, comparer les valeurs numériques
        return sortDirection === "asc" ? sizeA - sizeB : sizeB - sizeA;
      }

      return 0;
    });

    return result;
  };

  const toggleSort = (type: "name" | "date" | "size") => {
    if (sortType === type) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortType(type);
      setSortDirection("asc");
    }
  };

  const handleAction = (fileId: string, action: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    if (action === "download" && !file.is_folder) {
      handleDownload(file.url, file.name);
    } else if (action === "delete") {
      confirmDelete(fileId, file.is_folder);
    } else if (action === "open" && file.is_folder) {
      handleFolderClick(fileId, file.name);
    }

    // Fermer le menu d'actions
    setShowActionMenu(null);
  };

  // Rendu du loading spinner
  if (isLoading || !role) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar pour desktop */}
      <div className="">
        <SidebarAdmin />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-xs">
          <div className="px-4 py-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-2xl font-semibold text-gray-800">
                Gestionnaire de documents
              </h1>

              <div className="flex items-center gap-2">
                {/* Bouton de recherche mobile */}
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-full sm:hidden"
                >
                  <FaSearch />
                </button>

                {/* Recherche pour desktop */}
                <div className="relative hidden sm:block">
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>

                {/* Boutons d'affichage */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
                    title="Vue liste"
                  >
                    <FaListUl />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
                    title="Vue grille"
                  >
                    <FaTh />
                  </button>
                </div>
              </div>
            </div>

            {/* Barre de recherche mobile (expandable) */}
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 sm:hidden overflow-hidden"
                >
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Zone de navigation (breadcrumbs) et actions */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Breadcrumbs */}
            <div className="flex items-center flex-wrap gap-1.5">
              {folderPath.map((folder, index) => (
                <span key={folder.id || "root"} className="flex items-center">
                  {index > 0 && (
                    <FaChevronRight className="mx-1 text-gray-400 text-xs" />
                  )}
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    className={`px-2 py-1 rounded hover:bg-gray-200 ${
                      index === folderPath.length - 1
                        ? "font-medium text-blue-600 bg-blue-50"
                        : "text-gray-700"
                    }`}
                  >
                    {index === 0 ? (
                      <FaFolderOpen className="inline mr-1.5" />
                    ) : null}
                    {folder.name}
                  </button>
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFolderModalOpen(true)}
                className="px-3 py-2 bg-green-50 text-green-600 border border-green-200 rounded-md hover:bg-green-100 transition-colors flex items-center text-sm"
              >
                <FaPlus className="mr-1.5" /> Nouveau dossier
              </button>
              <button
                onClick={handleUploadClick}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center text-sm"
              >
                <FaUpload className="mr-1.5" /> Upload fichier
              </button>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {/* Indicateur de chargement */}
          {isLoading2 && (
            <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-sm text-gray-700">Chargement...</p>
              </div>
            </div>
          )}

          {/* Affichage des résultats de recherche */}
          {searchQuery && (
            <div className="mb-4 px-1">
              <p className="text-sm text-gray-500">
                {filteredAndSortedFiles().length} résultat(s) pour &quot;
                {searchQuery}&quot;
              </p>
            </div>
          )}

          {/* Message si dossier vide */}
          {filteredAndSortedFiles().length === 0 && !isLoading2 && (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaFolderOpen className="text-gray-400 text-3xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-700">
                Dossier vide
              </h3>
              <p className="text-gray-500 mt-1">
                Ce dossier ne contient aucun document
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={() => setIsFolderModalOpen(true)}
                  className="px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-md hover:bg-green-100 transition-colors flex items-center text-sm"
                >
                  <FaPlus className="mr-1.5" /> Nouveau dossier
                </button>
                <button
                  onClick={handleUploadClick}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors flex items-center text-sm"
                >
                  <FaUpload className="mr-1.5" /> Upload fichier
                </button>
              </div>
            </div>
          )}

          {/* Vue Liste */}
          {viewMode === "list" && filteredAndSortedFiles().length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort("name")}
                    >
                      <div className="flex items-center">
                        Nom
                        {sortType === "name" &&
                          (sortDirection === "asc" ? (
                            <FaSort className="ml-1 text-blue-500" />
                          ) : (
                            <FaSort className="ml-1 text-blue-500" />
                          ))}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden sm:table-cell"
                      onClick={() => toggleSort("size")}
                    >
                      <div className="flex items-center">
                        Taille
                        {sortType === "size" &&
                          (sortDirection === "asc" ? (
                            <FaSort className="ml-1 text-blue-500" />
                          ) : (
                            <FaSort className="ml-1 text-blue-500" />
                          ))}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                      onClick={() => toggleSort("date")}
                    >
                      <div className="flex items-center">
                        Créé le
                        {sortType === "date" &&
                          (sortDirection === "asc" ? (
                            <FaSort className="ml-1 text-blue-500" />
                          ) : (
                            <FaSort className="ml-1 text-blue-500" />
                          ))}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedFiles().map((file) => (
                    <tr
                      key={file.id}
                      className="hover:bg-gray-50 transition-colors"
                      onDoubleClick={() =>
                        file.is_folder && handleFolderClick(file.id, file.name)
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="shrink-0 h-9 w-9 flex items-center justify-center">
                            {file.is_folder ? (
                              <FaFolder className="text-yellow-400 text-lg" />
                            ) : (
                              <Image
                                src={`/${getIconName(file.type)}.png`}
                                alt="icon"
                                width={24}
                                height={24}
                              />
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {file.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-sm text-gray-700">{file.size}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-gray-700">{file.type || 'Non spécifié'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">
                        {file.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-3">
                          {file.is_folder ? (
                            <button
                              onClick={() =>
                                handleFolderClick(file.id, file.name)
                              }
                              className="text-blue-600 hover:text-blue-900"
                              title="Ouvrir"
                            >
                              <FaFolderOpen />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleDownload(file.url, file.name)
                              }
                              className="text-blue-600 hover:text-blue-900"
                              title="Télécharger"
                            >
                              <FaDownload />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() =>
                                confirmDelete(file.id, file.is_folder)
                              }
                              className="text-red-500 hover:text-red-700"
                              title="Supprimer"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Vue Grille */}
          {viewMode === "grid" && filteredAndSortedFiles().length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAndSortedFiles().map((file) => (
                <div
                  key={file.id}
                  className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs hover:shadow-md transition-shadow"
                >
                  <div
                    className="p-4 cursor-pointer flex flex-col items-center"
                    onDoubleClick={() =>
                      file.is_folder && handleFolderClick(file.id, file.name)
                    }
                  >
                    <div className="w-16 h-16 flex items-center justify-center mb-3">
                      {file.is_folder ? (
                        <FaFolder className="text-yellow-400 text-4xl" />
                      ) : (
                        <Image
                          src={`/${getIconName(file.type)}.png`}
                          alt="icon"
                          width={48}
                          height={48}
                        />
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-center text-gray-900 line-clamp-2 mb-1">
                      {file.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {file.is_folder
                        ? "Dossier"
                        : `${file.size} • ${file.type || 'Fichier'}`}
                    </p>
                  </div>

                  {/* Menu contextuel */}
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() =>
                        setShowActionMenu(
                          showActionMenu === file.id ? null : file.id
                        )
                      }
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-hidden"
                    >
                      <FaEllipsisV />
                    </button>

                    {showActionMenu === file.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        <div className="py-1">
                          {file.is_folder ? (
                            <button
                              onClick={() => handleAction(file.id, "open")}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <FaFolderOpen className="mr-2" /> Ouvrir
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction(file.id, "download")}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <FaDownload className="mr-2" /> Télécharger
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleAction(file.id, "delete")}
                              className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                            >
                              <FaTrash className="mr-2" /> Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {/* Modal Nouveau Dossier */}
      <AnimatePresence>
        {isFolderModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Créer un nouveau dossier
                  </h2>
                  <button
                    onClick={() => setIsFolderModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-hidden"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="folder-name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nom du dossier
                    </label>
                    <input
                      type="text"
                      id="folder-name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-xs focus:outline-hidden focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Mon dossier"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="folder-access"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Droits d&apos;accès
                    </label>
                    <select
                      id="folder-access"
                      value={newFolderAccess}
                      onChange={(e) => setNewFolderAccess(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-xs focus:outline-hidden focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="adherent">Adhérents (connectés)</option>
                      <option value="admin">Admin (restreint)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFolderModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleAddFolder}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Créer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Erreur */}
      <AnimatePresence>
        {isErrorModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                  <FaTimes className="text-red-600 text-lg" />
                </div>
                <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">
                  Accès refusé
                </h2>
                <p className="text-gray-600 text-center mb-6">
                  Vous n&apos;avez pas les droits administrateurs pour réaliser
                  cette action.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => setIsErrorModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-md focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmation de suppression */}
      <ModalConfirm
        isOpen={isConfirmOpen}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleDelete}
        onCancel={() => {
          setIsConfirmOpen(false);
          setFileToDeleteId(null);
        }}
      />

      {/* Modal d'upload de fichier */}
      <ModalAddDocument
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentFolderId={folderPath[folderPath.length - 1].id}
        onUploadSuccess={refreshCurrentFolder}
      />

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center ${
              notification.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
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
    </div>
  );
}
