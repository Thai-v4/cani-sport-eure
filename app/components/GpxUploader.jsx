"use client";

import { useState } from "react";
import supabase from "@/lib/supabaseClient"; // Client Supabase (session partagée)

// 📌 Connexion à Supabase

const GpxUploader = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [sport, setSport] = useState("");
  const [uploadDate, setUploadDate] = useState(""); // 📌 Ajout du champ date_time

  // 📌 Fonction pour traiter le fichier GPX
  const parseGpxFile = async (gpxFile) => {
    const text = await gpxFile.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");

    let points = [];
    const trkpts = xmlDoc.getElementsByTagName("trkpt");

    for (let i = 0; i < trkpts.length; i++) {
      const lat = trkpts[i].getAttribute("lat");
      const lon = trkpts[i].getAttribute("lon");
      const eleTag = trkpts[i].getElementsByTagName("ele");

      const ele = eleTag.length > 0 ? parseFloat(eleTag[0].textContent) : null;


      points.push([parseFloat(lon), parseFloat(lat), ele]);
    }

    return points;
  };

  const sanitizeFileName = (fileName) => {
    return fileName
      .normalize("NFD") // Supprime les accents
      .replace(/[\u0300-\u036f]/g, "") // Supprime les diacritiques
      .replace(/\s+/g, "_") // Remplace les espaces par des _
      .replace(/[^a-zA-Z0-9._-]/g, ""); // Supprime les caractères spéciaux sauf _ . -
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("❌ Aucun fichier sélectionné.");
      return;
    }
  
    setUploading(true);
    setMessage("📡 Upload en cours...");
  
    const sanitizedFileName = sanitizeFileName(file.name);
    const filePath = `gpx-files/${sanitizedFileName}`;
  
    // 📌 Étape 1 : Upload du fichier GPX dans Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from("gpx-files")
      .upload(filePath, file, { upsert: true });
  
    if (uploadError) {
      console.error("❌ Erreur d'upload :", uploadError);
      setMessage("❌ Erreur lors de l'upload.");
      setUploading(false);
      return;
    }
  
  
    // 📌 Étape 2 : Récupération de l'URL publique du fichier
    // 📌 Récupération de l'URL publique après l'upload
    const { data: publicUrlData } = await supabase
      .storage
      .from("gpx-files")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl || `https://rgnnrsrdrfzvjtfevim.supabase.co/storage/v1/object/public/${filePath}`; 


  
    // 📌 Étape 3 : Génération de la date et heure actuelle
    const dateToInsert = uploadDate ? new Date(uploadDate).toISOString() : new Date().toISOString();

  
    // 📌 Étape 4 : Lire et extraire les coordonnées GPS du fichier GPX
    const coordinates = await parseGpxFile(file);
    if (coordinates.length === 0) {
      setMessage("❌ Erreur : Le fichier GPX est vide ou invalide.");
      setUploading(false);
      return;
    }
  
    // 📌 Étape 5 : Conversion des coordonnées en WKT (Well-Known Text)
    const wktLineString = `LINESTRINGZ(${coordinates.map(([lon, lat, ele]) => `${lon} ${lat} ${ele || 0}`).join(", ")})`;
  
  
    
    // 📌 Étape 6 : Insérer les données en base avec `file_url`, `date_time`, et `sport`
    const { error: dbError } = await supabase
      .from("gpx_tracks")
      .insert([
        {
          name: sanitizedFileName,
          sport: sport,
          date_time: dateToInsert, // ✅ Ajout de la date et heure en UTC
          file_url: publicUrl, // ✅ Ajout de l'URL publique du fichier
          geom: `SRID=4326;${wktLineString}` // ✅ Ajout du tracé GPS
        }
      ]);
  
    if (dbError) {
      console.error("❌ Erreur d'insertion en base :", dbError);
      setMessage("❌ Erreur d'insertion en base.");
    } else {
      setMessage("✅ Fichier GPX ajouté avec succès !");
    }
  
    setUploading(false);
  };
  

  return (
    <div>
      <h2>Uploader un fichier GPX</h2>

      {/* 📌 Champ pour choisir la date et l'heure */}
      <div>
        <label htmlFor="datetime">Date et Heure :</label>
        <input
          type="datetime-local"
          id="datetime"
          value={uploadDate}
          onChange={(e) => setUploadDate(e.target.value)}
          style={{ marginLeft: "10px" }}
        />
      </div>

      <input 
        type="text" 
        placeholder="Sport (ex: Course à pied, Cyclisme...)" 
        value={sport} 
        onChange={(e) => setSport(e.target.value)}
      />

      <input type="file" accept=".gpx" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Upload en cours..." : "Uploader"}
      </button>
      <p>{message}</p>
    </div>
  );
};

export default GpxUploader;
