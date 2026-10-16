import { ReactNode } from "react";
import Image from "next/image";

// Définition du type EncadreProps
interface EncadreProps {
  children?: ReactNode;
  width?: number | "full"; // Largeur dynamique (full = 100vw)
  height?: number;         // Hauteur dynamique
  maxSize?: boolean;       // Forcer largeur/hauteur maximales
  scaleFactor?: number;    // Coefficient de rescale des images (doit être > 0)
}

const WhiteBackground = ({ children, width, height, maxSize = false, scaleFactor = 1 }: EncadreProps) => {
  // Vérification pour éviter les valeurs invalides
  const validScaleFactor = scaleFactor > 0 ? scaleFactor : 1;

  // Gestion des dimensions
  const computedWidth = width ? (width === "full" ? "100vw" : `${width}px`) : maxSize ? "100%" : "auto";
  const computedHeight = height ? `${height}px` : maxSize ? "100%" : "auto";

  return (
    <div
      className="relative overflow-hidden bg-white p-4"
      style={{
        width: computedWidth,
        height: computedHeight,
        maxWidth: "100%", 
        maxHeight: "100%",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* === Fond_TL (Haut-Gauche) === */}
      <div
        className="absolute top-0 left-0"
        style={{
          width: `${100 * validScaleFactor}%`,
          height: `${100 * validScaleFactor}%`,
          zIndex: -1,
          position: "absolute",
        }}
      >
        <Image 
          src="/fond.png" 
          alt="Fond_TL" 
          fill
          style={{ objectFit: "cover", opacity: 0.8 }} // Ajuster l'opacité si besoin
        />
      </div>

      {/* === Fond_BD (Bas-Droit) === */}
      <div
        className="absolute bottom-0 right-0"
        style={{
          width: `${100 * validScaleFactor}%`,
          height: `${100 * validScaleFactor}%`,
          zIndex: -1,
          position: "absolute",
        }}
      >
        <Image 
          src="/fond.png" 
          alt="Fond_BD" 
          fill
          style={{ objectFit: "cover", opacity: 0.8, transform: "rotate(180deg)" }} // Rotation pour bien s'adapter
        />
      </div>

      {/* Contenu au-dessus des images */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default WhiteBackground;