"use client"; // Indique que ce composant s'exécute côté client

import { useEffect, useState } from "react"; // Hooks React
import { FaFolder, FaChevronRight } from "react-icons/fa"; // Icônes de dossier et flèche
import supabase from "@/lib/supabaseClient"; // Client Supabase
import { isComptable as hasComptableFlag } from "@/lib/roles";
import { getSignedDownloadUrl } from "@/lib/storage";
import Image from "next/image"; // Composant d'image optimisé Next.js
import Sidebar from "../components/sidebars/Sidebar"; // Barre latérale de navigation
import Footer from "../components/sidebars/Footer"; // Pied de page
import { useAuth } from "../components/Auth/AuthProvider"; // Hook d'authentification
import { useRouter } from "next/navigation"; // Navigation Next.js

// ✅ Définition du type des fichiers et dossiers
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

export default function Document() {
  const [files, setFiles] = useState<DocumentFile[]>([]); // Liste des fichiers/dossiers
  const [folderPath, setFolderPath] = useState<
    { id: string | null; name: string }[]
  >([
    { id: null, name: "Dossier Racine" }, // Chemin initial (racine)
  ]);
  const { role, user, isLoading } = useAuth(); // Données d'authentification
  const router = useRouter(); // Router pour la navigation

  // Détermination des droits d'accès
  const isAdmin = role === "admin";
  const hasComptabiliteAccess = hasComptableFlag(user); // Accès comptabilité (admin + comptable)
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Téléchargement via une URL signée temporaire (le bucket peut rester privé)
  const handleDownload = async (file: DocumentFile) => {
    setDownloadError(null);
    const signedUrl = file.url
      ? await getSignedDownloadUrl(file.url, "club-documents", file.name)
      : null;
    if (signedUrl) {
      window.location.href = signedUrl;
    } else {
      setDownloadError(`Impossible de télécharger « ${file.name} ». Réessayez ou contactez le bureau.`);
    }
  };

  // 📁 Récupérer les fichiers du dossier courant avec filtrage selon le rôle
  useEffect(() => {
    const fetchFiles = async () => {
      let query = supabase.from("club_documents").select("*");

      // Filtrage par dossier parent
      if (folderPath.length > 1) {
        query = query.eq("parent_id", folderPath[folderPath.length - 1].id); // Dans un sous-dossier
      } else {
        query = query.is("parent_id", null); // À la racine
      }

      // Filtrage selon le niveau d'accès de l'utilisateur
      if (hasComptabiliteAccess) {
        query = query.in("access_level", [
          "public",
          "adherent",
          "admin",
          "admin_comptable",
        ]);
      } else if (isAdmin) {
        query = query.in("access_level", ["public", "adherent", "admin"]);
      } else if (role === "adherent") {
        query = query.in("access_level", ["public", "adherent"]);
      } else {
        query = query.eq("access_level", "public"); // Utilisateur non connecté
      }

      // Exécution de la requête
      const { data, error } = await query;

      if (error) {
        console.error("❌ Erreur de récupération :", error);
      } else {
        // Transformation des données et filtrage supplémentaire
        setFiles(
          data
            .filter((file) => {
              // Exclusion des fichiers comptables pour utilisateurs sans accès
              if (
                file.access_level === "admin_comptable" &&
                !hasComptabiliteAccess
              ) {
                return false;
              }
              return true;
            })
            .map((file) => ({
              id: file.id,
              name: file.name,
              size: file.size ? (file.size / 1024).toFixed(2) + " KB" : "-",
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
    };

    // Chargement des fichiers si utilisateur authentifié
    if (!isLoading && role) {
      fetchFiles();
    }
  }, [folderPath, role, isLoading, hasComptabiliteAccess, isAdmin]);

  // 📌 Naviguer dans un dossier
  const handleFolderClick = (folderId: string, folderName: string) => {
    setFolderPath([...folderPath, { id: folderId, name: folderName }]);
  };

  // 📌 Revenir à un dossier précédent
  const handleBreadcrumbClick = (index: number) => {
    setFolderPath(folderPath.slice(0, index + 1));
  };

  // 📌 Rediriger si l'utilisateur connecté n'a pas de rôle valide
  useEffect(() => {
    if (
      !isLoading &&
      role !== "adherent" &&
      role !== "admin" &&
      role !== null
    ) {
      router.push("/connexion");
    }
  }, [isLoading, role, router]);

  // Affichage d'un indicateur de chargement
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="">
      <div
        className="p-6 bg-white min-h-screen rounded-lg w-full mx-auto mt-8"
        style={{ fontFamily: "Calibri, sans-serif" }}
      >
        {/* Titre de la page */}
        <h1
          className="text-3xl font-bold mb-8 text-left text-black font-opendyslexic"
          style={{
            fontSize: "36px",
            fontFamily: "opendyslexic, sans-serif",
          }}
        >
          Documents
        </h1>

        {/* 📌 Fil d'Ariane pour la navigation */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-gray-700 text-lg">
            {folderPath.map((folder, index) => (
              <span key={folder.id || "root"} className="flex items-center">
                {index > 0 && <FaChevronRight className="mx-2 text-gray-500" />}
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className="hover:underline"
                >
                  {folder.name}
                </button>
              </span>
            ))}
          </div>
        </div>

        {downloadError && (
          <p role="alert" className="mb-4 text-red-700">
            {downloadError}
          </p>
        )}

        {/* 📄 Tableau des fichiers et dossiers */}
        <div className="overflow-auto max-h-[600px] border border-gray-300 rounded-md">
          <table className="w-full border border-gray-300 text-gray-700">
            <thead className="bg-gray-100">
              <tr>
                <th className="border-t border-b p-4 text-left">Nom</th>
                <th className="border-t border-b p-4 text-left">Taille</th>
                <th className="border-t border-b p-4 text-left">Type</th>
                <th className="border-t border-b p-4 text-left">Créé le</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr
                  key={file.id}
                  className="border-b text-md hover:bg-gray-50 cursor-pointer"
                  onDoubleClick={() =>
                    file.is_folder && handleFolderClick(file.id, file.name)
                  }
                >
                  <td className="p-4 flex items-center gap-2">
                    {/* Affichage de l'icône selon le type (dossier ou fichier) */}
                    {file.is_folder ? (
                      <FaFolder className="text-yellow-500" />
                    ) : (
                      <Image
                        src={`/${file.type?.toLowerCase() || "file"}.png`}
                        alt="icon"
                        width="20"
                        height="20"
                      />
                    )}
                    {/* Bouton pour ouvrir le dossier ou télécharger le fichier (accessible au clavier) */}
                    {file.is_folder ? (
                      <button
                        type="button"
                        onClick={() => handleFolderClick(file.id, file.name)}
                        className="text-blue-500 hover:underline text-left"
                      >
                        {file.name}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        className="text-blue-500 hover:underline text-left"
                      >
                        {file.name}
                      </button>
                    )}
                  </td>
                  <td className="p-4">{file.size}</td>
                  <td className="p-4">{file.type}</td>
                  <td className="p-4">{file.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Sidebar /> {/* Barre latérale de navigation */}
      <Footer /> {/* Pied de page */}
    </div>
  );
}
