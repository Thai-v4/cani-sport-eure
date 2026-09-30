"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FaTrash,
  FaFolder,
  FaChevronRight,
  FaTimes,
  FaPlus,
  FaUpload,
  FaSearch,
  FaEye,
  FaHome,
  FaBars,
  FaDownload,
  FaInfoCircle,
  FaThLarge,
  FaList,
} from "react-icons/fa";
import supabase from "@/lib/supabaseClient"; // Client Supabase (session partagée)
import SidebarAdmin from "../components/SidebarAdmin";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/Auth/AuthProvider";
import ModalConfirm from "../components/ModalConfirm";
import { AnimatePresence, motion } from "framer-motion";

// Connexion à Supabase

// Définition des types
interface Album {
  id: string;
  name: string;
  createdAt: string;
  parent_id?: string | null;
}

interface Photo {
  id: string;
  name: string;
  url: string;
  size: string;
  createdAt: string;
  album_id: string;
}

export default function AlbumManager() {
  const { role, isLoading } = useAuth();
  const router = useRouter();

  // États pour les albums et photos
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albumPath, setAlbumPath] = useState<
    { id: string | null; name: string }[]
  >([{ id: null, name: "Albums Photos" }]);

  // États pour l'interface utilisateur
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // États pour la modal de confirmation
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => {});

  // Afficher une notification
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fonction pour ouvrir une modal de confirmation
  const openConfirmationModal = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setOnConfirmAction(() => onConfirm);
    setModalOpen(true);
  };

  // Protection de la route - redirection si non admin
  useEffect(() => {
    if (!isLoading && role !== "admin") {
      router.push("/connexion");
    }
  }, [role, isLoading, router]);

  // Chargement des albums et photos depuis Supabase
  const fetchAlbumsAndPhotos = useCallback(async () => {
    if (isLoading || role !== "admin") return;

    setLoading(true);
    setErrorMessage(null);

    try {
      // Récupération des fichiers dans le dossier courant
      const { data, error } = await supabase.storage
        .from("photo")
        .list(albumPath[albumPath.length - 1].id || "");

      if (error) {
        console.error("❌ Erreur de récupération des fichiers :", error);
        setErrorMessage("Impossible de charger les albums et photos.");
        return;
      }

      const newAlbums: Album[] = [];
      const newPhotos: Photo[] = [];

      // Traitement des données récupérées pour séparer albums et photos
      data.forEach((item) => {
        if (item.name.startsWith(".")) return;

        const currentPath = albumPath[albumPath.length - 1].id || "";

        // Si pas de metadata, c'est un dossier (album)
        if (!item.metadata) {
          newAlbums.push({
            id: currentPath ? `${currentPath}/${item.name}` : item.name,
            name: item.name,
            createdAt: "-",
            parent_id: currentPath || null,
          });
        } else {
          // Sinon c'est un fichier (photo)
          const filePath = currentPath
            ? `${currentPath}/${item.name}`
            : item.name;
          const publicUrl = supabase.storage
            .from("photo")
            .getPublicUrl(filePath).data.publicUrl;

          const size = item.metadata?.size
            ? (item.metadata.size / 1024).toFixed(2) + " KB"
            : "-";

          newPhotos.push({
            id: item.name,
            name: item.name,
            url: publicUrl,
            size,
            createdAt: item.metadata.lastModified
              ? new Date(item.metadata.lastModified).toLocaleString()
              : "-",
            album_id: currentPath,
          });
        }
      });

      setAlbums(newAlbums);
      setPhotos(newPhotos);
    } catch (err) {
      console.error("❌ Exception lors du chargement :", err);
      setErrorMessage("Une erreur inattendue s'est produite.");
    } finally {
      setLoading(false);
    }
  }, [albumPath, role, isLoading]);

  useEffect(() => {
    fetchAlbumsAndPhotos();
  }, [fetchAlbumsAndPhotos]);

  // Naviguer dans un album
  const handleAlbumClick = (albumId: string, albumName: string) => {
    setAlbumPath([...albumPath, { id: albumId, name: albumName }]);
  };

  // Revenir en arrière dans les albums
  const handleBreadcrumbClick = (index: number) => {
    setAlbumPath(albumPath.slice(0, index + 1));
  };

  // Ajout d'un nouvel album
  const handleAddAlbum = async () => {
    if (!newAlbumName.trim()) {
      showNotification("Veuillez saisir un nom d'album", "error");
      return;
    }

    setUploading(true);

    try {
      const albumPathName = albumPath[albumPath.length - 1].id || "";
      // Création d'un dossier en ajoutant un fichier vide (workaround Supabase)
      const { error } = await supabase.storage
        .from("photo")
        .upload(
          `${albumPathName}/${newAlbumName}/.emptyFolderPlaceholder`,
          new Blob([""])
        );

      if (error) {
        console.error("❌ Erreur d'ajout de l'album :", error);
        showNotification("Erreur lors de la création de l'album", "error");
      } else {
        setAlbums([
          ...albums,
          { id: newAlbumName, name: newAlbumName, createdAt: "-" },
        ]);
        setIsAlbumModalOpen(false);
        setNewAlbumName("");
        showNotification(`Album "${newAlbumName}" créé avec succès`, "success");
      }
    } catch (err) {
      console.error("❌ Exception lors de la création de l'album :", err);
      showNotification("Une erreur inattendue s'est produite", "error");
    } finally {
      setUploading(false);
    }
  };

  // Supprimer une photo avec confirmation
  const handleDeletePhoto = (photo: Photo) => {
    openConfirmationModal(
      "Supprimer la photo",
      `Voulez-vous vraiment supprimer la photo "${photo.name}" ?`,
      async () => {
        try {
          const { error } = await supabase.storage
            .from("photo")
            .remove([`${photo.album_id}/${photo.name}`]);

          if (error) {
            console.error("❌ Erreur de suppression :", error);
            showNotification(
              "Erreur lors de la suppression de la photo",
              "error"
            );
          } else {
            setPhotos(photos.filter((p) => p.id !== photo.id));
            showNotification("Photo supprimée avec succès", "success");
          }
        } catch (err) {
          console.error("❌ Exception lors de la suppression :", err);
          showNotification("Une erreur inattendue s'est produite", "error");
        } finally {
          setModalOpen(false);
        }
      }
    );
  };

  // Supprimer un album avec confirmation
  const handleDeleteAlbum = (album: Album) => {
    openConfirmationModal(
      "Supprimer l'album",
      `Voulez-vous vraiment supprimer l'album "${album.name}" et tout son contenu ?`,
      async () => {
        try {
          // Récupération du contenu de l'album pour tout supprimer
          const { data, error } = await supabase.storage
            .from("photo")
            .list(album.id);

          if (error) {
            console.error("❌ Erreur de récupération des fichiers :", error);
            showNotification(
              "Erreur lors de la suppression de l'album",
              "error"
            );
            setModalOpen(false);
            return;
          }

          // Suppression de tous les fichiers dans l'album
          if (data.length > 0) {
            const filesToDelete = data.map(
              (file) => `${album.id}/${file.name}`
            );
            await supabase.storage.from("photo").remove(filesToDelete);
          }

          // Suppression du marqueur de dossier
          const { error: deleteError } = await supabase.storage
            .from("photo")
            .remove([`${album.id}/.emptyFolderPlaceholder`]);

          if (deleteError) {
            console.error("❌ Erreur de suppression de l'album :", deleteError);
            showNotification(
              "Erreur lors de la suppression de l'album",
              "error"
            );
          } else {
            setAlbums(albums.filter((a) => a.id !== album.id));
            showNotification(
              `Album "${album.name}" supprimé avec succès`,
              "success"
            );
          }
        } catch (err) {
          console.error("❌ Exception lors de la suppression :", err);
          showNotification("Une erreur inattendue s'est produite", "error");
        } finally {
          setModalOpen(false);
        }
      }
    );
  };

  // Gestion de l'upload de photos
  const handleUploadPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const albumPathName = albumPath[albumPath.length - 1].id || "";

      // Upload de chaque fichier sélectionné
      for (const file of files) {
        // Vérifier si c'est une image
        if (!file.type.startsWith("image/")) {
          errorCount++;
          continue;
        }

        const filePath = `${albumPathName}/${file.name}`;

        const { error } = await supabase.storage
          .from("photo")
          .upload(filePath, file);

        if (error) {
          console.error(`❌ Erreur d'upload du fichier ${file.name} :`, error);
          errorCount++;
        } else {
          successCount++;
          // Ajout de la photo à l'état local après upload réussi
          const publicUrl = supabase.storage
            .from("photo")
            .getPublicUrl(filePath).data.publicUrl;

          setPhotos((prevPhotos) => [
            ...prevPhotos,
            {
              id: file.name,
              name: file.name,
              url: publicUrl,
              size: (file.size / 1024).toFixed(2) + " KB",
              createdAt: new Date().toLocaleString(),
              album_id: albumPathName,
            },
          ]);
        }
      }

      if (successCount > 0) {
        showNotification(
          `${successCount} photo(s) importée(s) avec succès${errorCount > 0 ? `, ${errorCount} échec(s)` : ""}`,
          "success"
        );
      } else if (errorCount > 0) {
        showNotification(
          `Échec de l'import de ${errorCount} photo(s)`,
          "error"
        );
      }
    } catch (err) {
      console.error("❌ Exception lors de l'upload :", err);
      showNotification("Une erreur inattendue s'est produite", "error");
    } finally {
      setUploading(false);
    }
  };

  // Téléchargement d'une photo
  const handleDownloadPhoto = async (photo: Photo) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = photo.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
      showNotification("Téléchargement démarré", "success");
    } catch (err) {
      console.error("❌ Erreur lors du téléchargement :", err);
      showNotification("Erreur lors du téléchargement", "error");
    }
  };

  // Gestion du drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadPhotos(e.dataTransfer.files);
    }
  };

  // Navigation dans la visionneuse d'images
  const navigatePreview = (direction: "next" | "prev") => {
    const allPhotos = photos;
    if (allPhotos.length <= 1) return;

    let newIndex = previewIndex;
    if (direction === "next") {
      newIndex = (previewIndex + 1) % allPhotos.length;
    } else {
      newIndex = (previewIndex - 1 + allPhotos.length) % allPhotos.length;
    }

    setPreviewIndex(newIndex);
    setPreviewImage(allPhotos[newIndex].url);
  };

  // Filtrage des albums et photos basé sur la recherche
  const filteredAlbums = albums.filter((album) =>
    album.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPhotos = photos.filter((photo) =>
    photo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Si chargement initial ou pas administrateur
  if (isLoading || !role) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <SidebarAdmin />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* En-tête */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 py-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="display text-3xl md:text-4xl">
                Albums photo
              </h1>

              <div className="flex items-center gap-2">
                {/* Recherche */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>

                {/* Toggle vue grille/liste */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
                    title="Vue grille"
                  >
                    <FaThLarge />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
                    title="Vue liste"
                  >
                    <FaList />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenu principal - zone scrollable */}
        <div
          className="flex-1 overflow-auto"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="p-4 md:p-6">
            {/* Indication de drag & drop */}
            {isDragOver && (
              <div className="fixed inset-0 bg-blue-500/10 flex items-center justify-center z-20 border-2 border-dashed border-blue-500 pointer-events-none">
                <div className="bg-white p-6 rounded-lg text-center border border-rule">
                  <FaUpload className="text-4xl text-blue-500 mx-auto mb-2" />
                  <p className="text-lg font-medium text-gray-800">
                    Déposez vos images ici
                  </p>
                </div>
              </div>
            )}

            {/* Navigation & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
              {/* Fil d'Ariane */}
              <div className="flex items-center flex-wrap gap-1.5 bg-white px-3 py-2 rounded-lg border border-rule">
                <button
                  onClick={() =>
                    setAlbumPath([{ id: null, name: "Albums Photos" }])
                  }
                  className="flex items-center text-blue-600 font-medium hover:underline"
                >
                  <FaHome className="mr-1.5" /> Accueil
                </button>

                {albumPath.slice(1).map((album, index) => (
                  <span key={album.id || "root"} className="flex items-center">
                    <FaChevronRight className="mx-1 text-gray-400 text-xs" />
                    <button
                      onClick={() => handleBreadcrumbClick(index + 1)}
                      className="px-2 py-1 rounded-sm hover:bg-gray-100"
                    >
                      {album.name}
                    </button>
                  </span>
                ))}
              </div>

              {/* Actions principales */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAlbumModalOpen(true)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 flex items-center"
                >
                  <FaFolder className="mr-1.5 text-yellow-500" /> Nouvel album
                </button>

                {albumPath.length > 1 && (
                  <label className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center">
                    <FaUpload className="mr-1.5" /> Importer des photos
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleUploadPhotos(e.target.files)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Affichage du contenu ou des messages d'état */}
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-3 text-gray-600">
                    Chargement des albums et photos...
                  </p>
                </div>
              </div>
            ) : errorMessage ? (
              <div className="border border-red-500 bg-red-50 p-4">
                <div className="flex">
                  <FaInfoCircle className="text-red-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-red-800">{errorMessage}</p>
                    <button
                      onClick={fetchAlbumsAndPhotos}
                      className="mt-2 text-sm text-red-600 underline"
                    >
                      Réessayer
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Message quand dossier vide */}
                {filteredAlbums.length === 0 && filteredPhotos.length === 0 && (
                  <div className="bg-white rounded-lg p-8 text-center my-4 border border-rule">
                    {searchQuery ? (
                      <>
                        <FaSearch className="text-gray-400 text-4xl mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-700 mb-1">
                          Aucun résultat pour &quot;{searchQuery}&quot;
                        </h3>
                        <p className="text-gray-500 mb-3">
                          Essayez avec d&apos;autres termes de recherche.
                        </p>
                        <button
                          onClick={() => setSearchQuery("")}
                          className="text-blue-600 hover:underline"
                        >
                          Effacer la recherche
                        </button>
                      </>
                    ) : (
                      <>
                        {albumPath.length > 1 ? (
                          <>
                            <FaFolder className="text-yellow-400 text-4xl mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-700 mb-1">
                              Cet album est vide
                            </h3>
                            <p className="text-gray-500 mb-3">
                              Ajoutez des photos ou créez des sous-albums.
                            </p>
                            <div className="flex justify-center gap-3 mt-4">
                              <button
                                onClick={() => setIsAlbumModalOpen(true)}
                                className="px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm flex items-center"
                              >
                                <FaFolder className="mr-1.5 text-yellow-500" />{" "}
                                Nouvel album
                              </button>
                              <label className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer text-sm flex items-center">
                                <FaUpload className="mr-1.5" /> Importer des
                                photos
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleUploadPhotos(e.target.files)
                                  }
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </>
                        ) : (
                          <>
                            <FaFolder className="text-yellow-400 text-4xl mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-700 mb-1">
                              Aucun album photo
                            </h3>
                            <p className="text-gray-500 mb-3">
                              Commencez par créer votre premier album.
                            </p>
                            <button
                              onClick={() => setIsAlbumModalOpen(true)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center mx-auto"
                            >
                              <FaPlus className="mr-1.5" /> Créer un album
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Vue en liste */}
                {viewMode === "list" &&
                  (filteredAlbums.length > 0 || filteredPhotos.length > 0) && (
                    <div className="bg-white rounded-lg overflow-hidden border border-rule">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 text-left">
                            <th className="px-4 py-3 text-sm font-medium text-gray-600">
                              Nom
                            </th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-600 hidden sm:table-cell">
                              Créé le
                            </th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-600 hidden sm:table-cell">
                              Taille
                            </th>
                            <th className="px-4 py-3 text-sm font-medium text-gray-600 text-center">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Liste des albums */}
                          {filteredAlbums.map((album) => (
                            <motion.tr
                              key={album.id}
                              className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                              whileHover={{
                                backgroundColor: "rgba(243, 244, 246, 0.7)",
                              }}
                              onDoubleClick={() =>
                                handleAlbumClick(album.id, album.name)
                              }
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <FaFolder className="text-yellow-500 mr-2 shrink-0" />
                                  <span className="font-medium text-gray-800">
                                    {album.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                                {album.createdAt}
                              </td>
                              <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                                -
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center gap-3">
                                  <button
                                    onClick={() =>
                                      handleAlbumClick(album.id, album.name)
                                    }
                                    className="p-1.5 text-blue-600 hover:text-blue-800"
                                    title="Ouvrir l'album"
                                  >
                                    <FaEye />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAlbum(album)}
                                    className="p-1.5 text-red-500 hover:text-red-700"
                                    title="Supprimer l'album"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}

                          {/* Liste des photos */}
                          {filteredPhotos.map((photo, index) => (
                            <motion.tr
                              key={photo.id}
                              className="border-t border-gray-100 hover:bg-gray-50"
                              whileHover={{
                                backgroundColor: "rgba(243, 244, 246, 0.7)",
                              }}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <Image
                                    src={photo.url}
                                    alt={photo.name}
                                    width={40}
                                    height={40}
                                    className="h-10 w-10 object-cover rounded-sm mr-3 shrink-0"
                                  />
                                  <span className="text-gray-800 line-clamp-1">
                                    {photo.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                                {photo.createdAt}
                              </td>
                              <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                                {photo.size}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center gap-3">
                                  <button
                                    onClick={() => {
                                      setPreviewImage(photo.url);
                                      setPreviewIndex(index);
                                    }}
                                    className="p-1.5 text-blue-600 hover:text-blue-800"
                                    title="Voir l'image"
                                  >
                                    <FaEye />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadPhoto(photo)}
                                    className="p-1.5 text-green-600 hover:text-green-800"
                                    title="Télécharger l'image"
                                  >
                                    <FaDownload />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePhoto(photo)}
                                    className="p-1.5 text-red-500 hover:text-red-700"
                                    title="Supprimer l'image"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                {/* Vue en grille */}
                {viewMode === "grid" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {/* Albums */}
                    {filteredAlbums.map((album) => (
                      <motion.div
                        key={album.id}
                        className="bg-white rounded-lg overflow-hidden transition-shadow cursor-pointer border border-rule"
                        whileHover={{ y: -3 }}
                        onClick={() => handleAlbumClick(album.id, album.name)}
                      >
                        <div className="h-32 bg-yellow-50 flex items-center justify-center">
                          <FaFolder className="text-yellow-400 text-5xl" />
                        </div>
                        <div className="p-3">
                          <div className="font-medium text-gray-800 line-clamp-1">
                            {album.name}
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-500">Album</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAlbum(album);
                              }}
                              className="p-1 text-gray-400 hover:text-red-500"
                              title="Supprimer l'album"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Photos */}
                    {filteredPhotos.map((photo, index) => (
                      <motion.div
                        key={photo.id}
                        className="bg-white rounded-lg overflow-hidden transition-shadow cursor-pointer relative group border border-rule"
                        whileHover={{ y: -3 }}
                        onClick={() => {
                          setPreviewImage(photo.url);
                          setPreviewIndex(index);
                        }}
                      >
                        <div className="h-32 bg-gray-100">
                          <Image
                            src={photo.url}
                            alt={photo.name}
                            width={200}
                            height={200}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <div className="font-medium text-gray-800 line-clamp-1">
                            {photo.name}
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-500">
                              {photo.size}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadPhoto(photo);
                                }}
                                className="p-1 text-gray-400 hover:text-green-500"
                                title="Télécharger"
                              >
                                <FaDownload />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePhoto(photo);
                                }}
                                className="p-1 text-gray-400 hover:text-red-500"
                                title="Supprimer"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Overlay au survol - Version corrigée */}
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <FaEye className="text-white text-2xl" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* État d'upload */}
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="fixed bottom-4 right-4 bg-white p-4 rounded-lg flex items-center gap-3 border border-rule"
            >
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Upload en cours...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-5 py-3 rounded-lg z-50 flex items-center ${ notification.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white" }`}
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

        {/* Modal de confirmation pour les suppressions */}
        <ModalConfirm
          isOpen={modalOpen}
          title={modalTitle}
          message={modalMessage}
          confirmText="Supprimer"
          cancelText="Annuler"
          onCancel={() => setModalOpen(false)}
          onConfirm={onConfirmAction}
        />

        {/* Modal de prévisualisation d'image */}
        <AnimatePresence>
          {previewImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/90 flex items-center justify-center z-50"
              onClick={() => setPreviewImage(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative max-w-[90%] max-h-[90%]"
              >
                <Image
                  src={previewImage}
                  alt="Aperçu de l'image"
                  width={1200}
                  height={800}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />

                {/* Navigation */}
                {photos.length > 1 && (
                  <>
                    <button
                      className="absolute top-1/2 -translate-y-1/2 left-4 p-3 rounded-full bg-black/40 text-white hover:bg-black/60"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigatePreview("prev");
                      }}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      className="absolute top-1/2 -translate-y-1/2 right-4 p-3 rounded-full bg-black/40 text-white hover:bg-black/60"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigatePreview("next");
                      }}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </>
                )}

                {/* Actions */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    className="p-3 rounded-full bg-black/40 text-white hover:bg-black/60"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadPhoto(photos[previewIndex]);
                    }}
                    title="Télécharger"
                  >
                    <FaDownload className="w-5 h-5" />
                  </button>
                  <button
                    className="p-3 rounded-full bg-black/40 text-white hover:bg-black/60"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(null);
                      handleDeletePhoto(photos[previewIndex]);
                    }}
                    title="Supprimer"
                  >
                    <FaTrash className="w-5 h-5" />
                  </button>
                </div>

                {/* Info sur l'image */}
                <div className="absolute bottom-4 left-4 bg-black/40 text-white px-3 py-2 rounded-md">
                  <div className="text-sm font-medium">
                    {photos[previewIndex]?.name}
                  </div>
                  <div className="text-xs opacity-80">
                    {photos[previewIndex]?.size}
                  </div>
                </div>

                {/* Bouton de fermeture */}
                <button
                  className="absolute top-4 right-4 p-3 rounded-full bg-black/40 text-white hover:bg-black/60"
                  onClick={() => setPreviewImage(null)}
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal d'ajout d'album */}
        <AnimatePresence>
          {isAlbumModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 overflow-y-auto bg-ink/50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg max-w-md w-full border border-rule"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Créer un nouvel album
                    </h2>
                    <button
                      onClick={() => setIsAlbumModalOpen(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="album-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nom de l&apos;album
                    </label>
                    <input
                      id="album-name"
                      type="text"
                      value={newAlbumName}
                      onChange={(e) => setNewAlbumName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Mon nouvel album"
                      autoFocus
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAlbumModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleAddAlbum}
                      disabled={!newAlbumName.trim() || uploading}
                      className={`px-4 py-2 text-sm font-medium text-white rounded-md ${ !newAlbumName.trim() || uploading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700" }`}
                    >
                      {uploading ? "Création..." : "Créer l'album"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
