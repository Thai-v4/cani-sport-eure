"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient"; // Client Supabase (session partagée)
import { FaTimes, FaCalendarAlt, FaClock } from "react-icons/fa";

// 📌 Connexion à Supabase

// 🔧 Conversion heure locale → ISO sans décalage
const toISOStringLocal = (dateStr) => {
  const date = new Date(dateStr);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString();
};

const ModalAdd = ({ isOpen, onClose, onAddSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState("error");
  const [sport, setSport] = useState("Cross");
  const [uploadDate, setUploadDate] = useState("");
  const [uploadTime, setUploadTime] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const normalizeFileName = (filename) => {
    return filename
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_\-.]/g, "_")
      .replace(/_+/g, "_")
      .trim();
  };

  const handleUpload = async () => {
    if (!title || !sport || !uploadDate || !uploadTime) {
      setTone("error"); setMessage("Veuillez remplir tous les champs requis.");
      return;
    }

    setUploading(true);
    setTone("info"); setMessage("Ajout en cours...");

    const localDateTime = `${uploadDate}T${uploadTime}`;
    const isoDateTime = toISOStringLocal(localDateTime);

    let publicUrl = null;
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
        setTone("error"); setMessage("Impossible d'extraire les coordonnées GPS du fichier.");
        setUploading(false);
        return;
      }

      linestringZ = `LINESTRINGZ(${coordinates.join(", ")})`;

      const { error: uploadError } = await supabase.storage
        .from("gpx-files")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("❌ Erreur d'upload :", uploadError);
        setTone("error"); setMessage("Erreur lors de l'upload.");
        setUploading(false);
        return;
      }

      const { data: publicUrlData } = await supabase.storage
        .from("gpx-files")
        .getPublicUrl(filePath);

      publicUrl = publicUrlData.publicUrl;
    }

    const { data: insertedData, error: dbError } = await supabase
      .from("gpx_tracks")
      .insert([
        {
          name: title,
          sport,
          date_time: isoDateTime,
          file_url: publicUrl,
          geom: linestringZ,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("❌ Erreur d'insertion en base :", dbError);
      setTone("error"); setMessage("Erreur d'insertion en base.");
    } else {
      setTone("success"); setMessage("Sortie ajoutée avec succès !");
      onAddSuccess?.(insertedData);
      onClose();
    }

    setUploading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl relative border border-rule">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900">
          <FaTimes />
        </button>

        <h2 className="text-2xl font-bold mb-4">Ajouter une sortie</h2>
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
          <input type="file" accept=".gpx" onChange={(e) => setFile(e.target.files[0])} className="hidden" id="fileUpload" />
          <label htmlFor="fileUpload" className="cursor-pointer bg-blue-700 text-white py-2 px-6 rounded-sm text-lg font-semibold hover:bg-blue-900 inline-block">
            Ajouter un fichier GPX
          </label>
          {file && <p className="mt-2 text-sm">{file.name}</p>}
        </div>

        <div className="text-center mt-6">
          <button onClick={handleUpload} disabled={uploading} className="bg-blue-700 text-white py-3 px-8 rounded-sm text-lg font-semibold hover:bg-blue-900">
            {uploading ? "Ajout en cours..." : "Ajouter une sortie"}
          </button>
        </div>

        {message && <p role="status" className={`text-center text-sm mt-2 ${tone === "success" ? "text-success" : tone === "info" ? "text-ink-2" : "text-danger"}`}>{message}</p>}
      </div>
    </div>
  );
};

export default ModalAdd;
