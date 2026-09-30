import type { Metadata, Viewport } from "next";
import { Mona_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { AuthProvider } from "./components/Auth/AuthProvider";
import SiteChrome from "./components/site/SiteChrome";

// Mona Sans : une seule famille, largeur variable (titres serrés, texte courant normal)
const mona = Mona_Sans({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-mona",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Cani-Sports Eure — courir avec son chien dans l'Eure",
    template: "%s · Cani-Sports Eure",
  },
  description:
    "Club de canisport de l'Eure : cani-cross, cani-trail, cani-marche, cani-VTT et cani-trottinette. Sorties, agenda, résultats, débutants bienvenus.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Cani-Sports Eure",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={mona.variable}>
      <body>
        <AuthProvider>
          <SiteChrome>{children}</SiteChrome>
          <SpeedInsights />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
