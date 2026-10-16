"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import distance from "@turf/distance";
import { point } from "@turf/helpers";
import Image from "next/image";

const MapWithStats = ({ trackData }) => {
  const [startAddress, setStartAddress] = useState("Recherche en cours...");

  const formatDateWithoutTZ = (isoString) => {
    const [datePart, timePart] = isoString.split("T");
    const [year, month, day] = datePart.split("-");
    const [hour, minute] = timePart.split(":");
    return `${day}/${month}/${year} à ${hour}h${minute}`;
  };
  

  const fetchAddress = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      if (!data.address) return "Adresse inconnue";

      const { house_number, road, postcode, city, town, village } = data.address;
      const locationCity = city || town || village || "Ville inconnue";
      return `${house_number ? house_number + " " : ""}${road || "Rue inconnue"}, ${
        postcode || ""
      } ${locationCity}`.trim();
    } catch (error) {
      console.error("❌ Erreur de géocodage inverse :", error);
      return "Adresse non trouvée";
    }
  };

  useEffect(() => {
    if (trackData?.geojson?.coordinates?.length > 0) {
      const [lon, lat] = trackData.geojson.coordinates[0];
      fetchAddress(lat, lon).then(setStartAddress);
    }
  }, [trackData]);

  if (!trackData) return <p>Chargement...</p>;

  if (!trackData?.geojson?.coordinates?.length) {
    const status = new Date(trackData.date_time) > new Date() ? "Ouvert" : "Fermé";
  
    return (
      <div
        style={{
          border: "2px solid black",
          borderRadius: "30px",
          overflow: "hidden",
          backgroundColor: "#f8f9fa",
          maxWidth: "400px",
          textAlign: "left",
          fontSize: "12px",
          position: "relative",
        }}
      >
        {/* 📌 Badge Ouvert/Fermé */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: status === "Ouvert" ? "#4EC052" : "#BB1119",
            color: "black",
            padding: "5px 10px",
            borderRadius: "30px",
            fontWeight: "bold",
            zIndex: 1000,
          }}
        >
          {status}
        </div>
  
        <div style={{ padding: "20px" }}>
          <h2 style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "10px" }}>{trackData.name}</h2>
          <p><strong>Date et Heure :</strong> {formatDateWithoutTZ(trackData.date_time)}</p>
          <p><strong>Adresse :</strong> Aucune adresse disponible</p>
          <p><strong>GPX :</strong> Aucune trace disponible</p>
        </div>
  
        {/* Bandeau sport en bas */}
        <div
          style={{
            width: "100%",
            backgroundColor: "#3D9CB8",
            color: "white",
            textAlign: "left",
            padding: "8px",
            fontSize: "12px",
            fontWeight: "bold",
            paddingLeft: "20px",
          }}
        >
          {trackData.sport || "Sport non défini"}
        </div>
      </div>
    );
  }
  
  

  const coordinates = trackData.geojson.coordinates.map(([lon, lat, ele]) => [
    lat,
    lon,
    ele || 0,
  ]);

  let totalDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const point1 = point([coordinates[i][1], coordinates[i][0]]);
    const point2 = point([coordinates[i + 1][1], coordinates[i + 1][0]]);
    totalDistance += distance(point1, point2, { units: "meters" });
  }

  let totalElevationGain = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const alt1 = coordinates[i][2];
    const alt2 = coordinates[i + 1][2];
    if (alt2 > alt1) totalElevationGain += alt2 - alt1;
  }

  const status = new Date(trackData.date_time) > new Date() ? "Ouvert" : "Fermé";

  return (
    <div
      style={{
        border: "2px solid black",
        borderRadius: "30px",
        overflow: "hidden",
        backgroundColor: "#f8f9fa",
        maxWidth: "400px",
        textAlign: "left",
        fontSize: "12px",
      }}
    >
      <div style={{ position: "relative" }}>
        <MapContainer center={coordinates[0]} zoom={12} style={{ height: "200px", width: "100%" }}>
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Polyline positions={coordinates.map(([lat, lon]) => [lat, lon])} color="blue" />
        </MapContainer>

        {/* 📌 Encadré "Ouvert" / "Fermé" */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: status === "Ouvert" ? "#4EC052" : "#BB1119",
            color: "black",
            padding: "5px 10px",
            borderRadius: "30px",
            fontWeight: "bold",
            zIndex: 1000, // ✅ Pour s'afficher au-dessus de la carte
          }}
        >
          {status}
        </div>
      </div>

      <h2 style={{ marginLeft: "20px", fontWeight: "bold", fontSize: "14px", marginTop: "20px",  marginBottom: "10px" }}>{trackData.name}</h2>

      {trackData.file_url && (
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginLeft: "20px" }}>
          <Image src="/Download.png" alt="Télécharger GPX" width={18} height={18} />
          <a href={trackData.file_url} download={trackData.name} style={{ fontSize: "12px" }}>
            Télécharger GPX
          </a>
        </div>
      )}

      <div style={{ marginLeft: "20px" }}>
        {/* ✅ Alignement des icônes et textes */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px", marginTop:"5px" }}>
          <Image src="/distance.svg" alt="Distance" width={18} height={18} />
          <p>
            <strong>Distance :</strong> {(totalDistance / 1000).toFixed(2)} km
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
          <Image src="/denivele.png" alt="Dénivelé" width={18} height={18} />
          <p>
            <strong>Dénivelé :</strong> {(totalElevationGain / totalDistance * 100).toFixed(2)} %
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
          <Image src="/puce.png" alt="Adresse" width={15} height={15} />
          <p>
            <strong>Adresse :</strong> {startAddress}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "15px" }}>
          <Image src="/calendar.png" alt="Date" width={15} height={15} />
          <p><strong>Date et Heure :</strong> {formatDateWithoutTZ(trackData.date_time)}</p>

        </div>
      </div>

      <div style={{ width: "100%", backgroundColor: "#3D9CB8", color: "white", textAlign: "left", padding: "8px", fontSize: "12px", fontWeight: "bold", paddingLeft:"20px" }}>
        {trackData.sport || "Sport non défini"}
      </div>
    </div>
  );
};

export default MapWithStats;
