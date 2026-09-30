import distance from "@turf/distance";
import { point } from "@turf/helpers";

// Coordonnées GeoJSON : [longitude, latitude, altitude?]
export type LonLatEle = [number, number, number?];

export function trackStats(coordinates: LonLatEle[]) {
  let meters = 0;
  let gain = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lon1, lat1, ele1] = coordinates[i];
    const [lon2, lat2, ele2] = coordinates[i + 1];
    meters += distance(point([lon1, lat1]), point([lon2, lat2]), { units: "meters" });
    if (typeof ele1 === "number" && typeof ele2 === "number" && ele2 > ele1) gain += ele2 - ele1;
  }
  return { km: meters / 1000, gain: Math.round(gain) };
}
