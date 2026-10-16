import { redirect } from "next/navigation";

// Ancienne galerie à plat, remplacée par les albums
export default function GaleriePage() {
  redirect("/album");
}
