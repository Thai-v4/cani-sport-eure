"use client"; // Indique que ce composant s'exécute côté client

import { useEffect, useState } from "react"; // Hooks React pour l'état et les effets
import { useParams } from "next/navigation"; // Hook pour accéder aux paramètres d'URL
import supabase from "@/lib/supabaseClient"; // Client Supabase pour accéder au stockage
import Image from "next/image"; // Composant Next.js pour l'optimisation des images
import Footer from "@/app/components/sidebars/Footer"; // Composant pied de page
import Sidebar from "@/app/components/sidebars/Sidebar"; // Barre latérale de navigation

// Structure des données d'image
interface ImageData {
  url: string; // URL publique de l'image
  name: string; // Nom du fichier
  createdAt: string; // Date de création
}

const GalleryPage = () => {
  const { album } = useParams(); // Récupération du paramètre 'album' de l'URL
  const [images, setImages] = useState<ImageData[]>([]); // Liste des images
  const [searchTerm, setSearchTerm] = useState(""); // Terme de recherche
  const [startDate, setStartDate] = useState(""); // Date de début pour filtrer
  const [endDate, setEndDate] = useState(""); // Date de fin pour filtrer
  const [loading, setLoading] = useState(true); // État de chargement
  const [previewImage, setPreviewImage] = useState<string | null>(null); // Image en prévisualisation
  const decodedAlbum = decodeURIComponent(album as string); // Décodage du nom de l'album

  // Chargement des images au montage du composant
  useEffect(() => {
    const fetchImages = async () => {
      if (!decodedAlbum) return;

      setLoading(true);
      // Récupération des fichiers dans le bucket Supabase
      const { data, error } = await supabase.storage
        .from("photo")
        .list(decodedAlbum);

      if (error) {
        console.error("Erreur lors de la récupération des images :", error);
        setLoading(false);
        return;
      }

      // Filtrage et formatage des images
      const imageUrls = data
        .filter((file) => file.name.match(/\.(png|jpe?g|gif|bmp|webp)$/i)) // Filtre sur les extensions d'image
        .map((file) => ({
          url:
            supabase.storage
              .from("photo")
              .getPublicUrl(`${decodedAlbum}/${file.name}`).data.publicUrl ||
            "",
          name: file.name,
          createdAt: file.created_at || "",
        }));

      setImages(imageUrls);
      setLoading(false);
    };

    fetchImages();
  }, [decodedAlbum]); // Relance le chargement si l'album change

  // Filtrage des images selon les critères (recherche et dates)
  const filteredImages = images.filter((image) => {
    const imageDate = image.createdAt ? new Date(image.createdAt) : null;

    // Logs pour débogage

    // Application des filtres
    const matchesSearch =
      searchTerm === "" ||
      image.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStartDate =
      startDate === "" || (imageDate && imageDate >= new Date(startDate));
    const matchesEndDate =
      endDate === "" ||
      (imageDate && imageDate <= new Date(`${endDate}T23:59:59`));

    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  // Gestion de la touche Échap pour fermer la prévisualisation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div>
      <div
        className="min-h-screen pr-8 pl-8 py-12"
        style={{ backgroundImage: "url('/fond.png')", backgroundSize: "cover" }}
      >
        <Sidebar /> {/* Barre latérale de navigation */}
        <h1
          className="text-3xl font-bold mb-8 text-left text-black"
          style={{
            fontSize: "36px",
            fontFamily: "opendyslexic, sans-serif",
          }}
        >
          Galerie de {decodedAlbum}
        </h1>
        {/* Filtres de recherche et de date */}
        <div className="flex flex-wrap gap-4 mb-8">
          <input
            type="text"
            placeholder="Rechercher une image"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-2 border-secondary p-3 rounded-full text-black w-[500px] max-w-full"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border-2 border-secondary p-2 rounded-md text-black"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border-2 border-secondary p-2 rounded-md text-black"
          />
        </div>
        {/* Affichage des images ou message d'état */}
        {loading ? (
          <p className="text-gray-500 font-calibri text-left">
            Chargement des images...
          </p>
        ) : filteredImages.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {filteredImages.map((image, index) => (
              <div
                key={index}
                className="mb-4 cursor-pointer"
                onClick={() => {
                  if (window.innerWidth >= 768) {
                    // Prévisualisation uniquement sur desktop
                    setPreviewImage(image.url);
                  }
                }}
              >
                <Image
                  src={image.url}
                  alt={image.name}
                  width={500}
                  height={500}
                  className="w-full h-auto object-cover border-2 border-black rounded-lg"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 font-calibri text-left">
            Aucune image disponible.
          </p>
        )}
        {/* Modale de prévisualisation d'image */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative">
              <button
                className="absolute top-4 right-4 text-white text-2xl font-bold"
                onClick={() => setPreviewImage(null)}
              >
                ✖
              </button>
              <Image
                src={previewImage}
                alt="Aperçu de l'image"
                width={800}
                height={800}
                className="max-w-(--breakpoint-lg) max-h-screen-lg rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
      <Footer /> {/* Pied de page */}
    </div>
  );
};

export default GalleryPage;
