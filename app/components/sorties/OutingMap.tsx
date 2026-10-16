"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import type { LatLngTuple } from "leaflet";

// Carte d'une trace : la ligne du parcours est tracée dans le bleu du site.
// Le zoom à la molette est coupé pour ne pas piéger le défilement de la page.
export default function OutingMap({ positions }: { positions: LatLngTuple[] }) {
  return (
    <MapContainer
      bounds={positions}
      boundsOptions={{ padding: [24, 24] }}
      scrollWheelZoom={false}
      className="size-full"
      attributionControl
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Polyline positions={positions} pathOptions={{ color: "#1238d6", weight: 3, opacity: 0.95 }} />
    </MapContainer>
  );
}
