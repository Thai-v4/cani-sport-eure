"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import Image from "next/image";
import NavigationBar from "../components/NavigationBar";

interface ImageData {
  url: string;
  createdAt: string;
}

const GalleryPage = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPc, setIsPc] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsPc(window.innerWidth > 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase.storage.from("photo").list();

      if (error) {
        console.error("Erreur lors de la récupération des images :", error);
        return;
      }

      const imageUrls = data
        .filter(
          (file) =>
            file.name.endsWith(".png") ||
            file.name.endsWith(".jpg") ||
            file.name.endsWith(".jpeg")
        )
        .map((file) => ({
          url:
            supabase.storage.from("photo").getPublicUrl(file.name).data
              .publicUrl || "",
          createdAt: file.created_at || "",
        }));

      setImages(imageUrls);
    };

    fetchImages();
  }, []);

  const filteredImages = images.filter((image) => {
    const matchesSearch =
      searchTerm === "" ||
      image.url.toLowerCase().includes(searchTerm.toLowerCase());
    const imageDate = new Date(image.createdAt);
    const matchesStartDate =
      startDate === "" || imageDate >= new Date(startDate);
    const endDateObj = endDate ? new Date(endDate + "T23:59:59") : null;
    const matchesEndDate =
      endDate === "" || (endDateObj && imageDate <= endDateObj);

    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  return (
    <div
      className="min-h-screen pr-8 pl-8"
      style={{
        backgroundImage: "url('/fond.png')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundColor: "white",
      }}
    >
      <NavigationBar />
      <h1
        className="text-3xl font-bold mb-8"
        style={{
          fontFamily: "opendyslexic, sans-serif",
          color: "black",
        }}
      >
        Galerie de photo
      </h1>

      <div className="flex flex-wrap gap-4 mb-8">
        <div
          className="flex items-center px-4 py-2 border w-full sm:w-auto"
          style={{
            backgroundColor: "white",
            borderRadius: "25px",
            border: "2px solid #001f5c",
          }}
        >
          <input
            type="text"
            placeholder="Rechercher une photo"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="outline-hidden w-full font-calibri text-black"
          />
          <span role="img" aria-label="search" className="ml-2 text-gray-500">
            🔍
          </span>
        </div>

        <div
          className="flex items-center px-4 py-2 border w-full sm:w-auto"
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            border: "2px solid #001f5c",
            color: "black",
          }}
        >
          <label className="mr-2 font-calibri text-black">Du</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="outline-hidden"
          />
        </div>

        <div
          className="flex items-center px-4 py-2 border w-full sm:w-auto"
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            border: "2px solid #001f5c",
            color: "black",
          }}
        >
          <label className="mr-2 font-calibri text-black">Au</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="outline-hidden"
          />
        </div>
      </div>

      <div
        className="columns-1 sm:columns-2 lg:columns-3 gap-4"
        style={{ paddingLeft: "2rem", paddingRight: "2rem" }}
      >
        {filteredImages.length > 0 ? (
          filteredImages.map((image, index) => (
            <div
              key={index}
              className="mb-4 cursor-pointer"
              onClick={() => isPc && setSelectedImage(image.url)}
            >
              <Image
                src={image.url}
                alt={`Gallery image ${index}`}
                width={500}
                height={500}
                className="w-full h-auto object-cover border-2 border-black rounded-lg"
              />
            </div>
          ))
        ) : (
          <p className="text-gray-500 font-calibri">Aucune image disponible.</p>
        )}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative">
            <Image
              src={selectedImage}
              alt="Image en grand"
              width={800}
              height={800}
              className="rounded-lg"
            />
            <button
              className="absolute top-2 right-2 text-white bg-black rounded-full p-2"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              ❌
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
