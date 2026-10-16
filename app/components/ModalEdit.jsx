"use client";

import { useState, useEffect } from "react";
import supabase from "@/lib/supabaseClient"; // Client Supabase (session partagée)
import { FaTimes, FaCalendarAlt, FaClock } from "react-icons/fa";

const toISOStringLocal = (dateStr) => {
  const date = new Date(dateStr);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString();
};

const normalizeFileName = (filename) => {
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_\-.]/g, "_")
    .replace(/_+/g, "_")
    .trim();
};

// Les hooks vivent dans le contenu : la modale fermée ne rend rien sans appel conditionnel de hook
const ModalEdit = (props) => {
  if (!props.isOpen || !props.sortie) return null;
  return <ModalEditContent {...props} />;
};

const ModalEditContent = ({ isOpen, onClose, sortie }) => {
  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("");
  const [uploadDate, setUploadDate] = useState("");
  const [uploadTime, setUploadTime] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setTitle(sortie.titre);
    setSport(sortie.categorie);

    const dateObj = new Date(sortie.date_time);
    const iso = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setUploadDate(iso.split("T")[0]);
    setUploadTime(iso.split("T")[1]);
  }, [sortie]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleUpdate = async () => {
    if (!title || !sport || !uploadDate || !uploadTime) {
      setMessage("❌ Veuillez remplir tous les champs requis.");
      return;
    }

    setUploading(true);
    setMessage("📡 Mise à jour en cours...");

    const isoDateTime = toISOStringLocal(`${uploadDate}T${uploadTime}`);
    let publicUrl = sortie.file_url;
    let linestringZ = null;

    if (file) {
      const sanitizedFileName = normalizeFileName(file.name);
      const filePath = `gpx-files/${sanitizedFileName}`;

      const fileContent = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(fileContent, "text/xml");

      const trkpts = xmlDoc.getElementsByTagName("trkpt");
      const coordinates = Array.from(trkpts).map((pt) => {
        const lat = pt.getAttribute("lat");
        const lon = pt.getAttribute("lon");
        const eleTag = pt.getElementsByTagName("ele");
        const ele = eleTag.length > 0 ? eleTag[0].textContent : "0";
        return `${lon} ${lat} ${ele}`;
      });

      if (coordinates.length === 0) {
        setMessage("❌ Impossible d'extraire les coordonnées GPS du fichier.");
        setUploading(false);
        return;
      }

      linestringZ = `LINESTRINGZ(${coordinates.join(", ")})`;

      const { error: uploadError } = await supabase.storage
        .from("gpx-files")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("❌ Erreur d'upload :", uploadError);
        setMessage("❌ Erreur lors de l'upload.");
        setUploading(false);
        return;
      }

      const { data: publicUrlData } = await supabase.storage
        .from("gpx-files")
        .getPublicUrl(filePath);

      publicUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase
      .from("gpx_tracks")
      .update({
        name: title,
        sport,
        date_time: isoDateTime,
        ...(file && { file_url: publicUrl, geom: linestringZ }),
      })
      .match({ id: sortie.id });

    if (error) {
      console.error("❌ Erreur de mise à jour :", error);
      setMessage("❌ Erreur de mise à jour.");
    } else {
      setMessage("✅ Sortie modifiée !");
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    }

    setUploading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900">
          <FaTimes />
        </button>

        <h2 className="text-2xl font-bold mb-4">Modifier la sortie</h2>
        <hr className="mb-6 border-gray-300" />

        <div className="mb-4">
          <label className="block text-sm font-semibold">Titre</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border border-gray-300 rounded-sm" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold">Catégories</label>
          <select value={sport} onChange={(e) => setSport(e.target.value)} className="w-full p-3 border border-gray-300 rounded-sm">
            <option value="Cross">Cross</option>
            <option value="Marche">Marche</option>
            <option value="Trail">Trail</option>
            <option value="VTT">VTT</option>
            <option value="Trottinette">Trottinette</option>
          </select>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="w-1/2 relative">
            <label className="block text-sm font-semibold">Date</label>
            <div className="relative">
              <input type="date" value={uploadDate} onChange={(e) => setUploadDate(e.target.value)} className="w-full p-3 border border-gray-300 rounded-sm pl-10" />
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
          </div>
          <div className="w-1/2 relative">
            <label className="block text-sm font-semibold">Heure</label>
            <div className="relative">
              <input type="time" value={uploadTime} onChange={(e) => setUploadTime(e.target.value)} className="w-full p-3 border border-gray-300 rounded-sm pl-10" />
              <FaClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="mb-4 text-left">
          <input type="file" accept=".gpx" onChange={(e) => setFile(e.target.files[0])} className="hidden" id="fileEditUpload" />
          <label htmlFor="fileEditUpload" className="cursor-pointer bg-blue-700 text-white py-2 px-6 rounded-full text-lg font-semibold hover:bg-blue-900 inline-block">
            Modifier le fichier GPX
          </label>
          {file && <p className="mt-2 text-sm">{file.name}</p>}
        </div>

        <div className="text-center mt-6">
          <button onClick={handleUpdate} disabled={uploading} className="bg-blue-700 text-white py-3 px-8 rounded-full text-lg font-semibold hover:bg-blue-900">
            {uploading ? "Mise à jour..." : "Mettre à jour la sortie"}
          </button>
        </div>

        {message && <p className="text-center text-sm mt-2 text-red-500">{message}</p>}
      </div>
    </div>
  );
};

export default ModalEdit;
