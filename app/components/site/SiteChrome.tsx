"use client";

import { usePathname } from "next/navigation";
import { ADMIN_PATHS, matchesPath } from "@/lib/routes";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

// Coque commune : en-tête et pied de page partout, sauf dans l'administration
// qui a sa propre coque (AdminShell).
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";

  if (matchesPath(pathname, ADMIN_PATHS)) return <>{children}</>;

  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-3 focus:text-white"
      >
        Aller au contenu
      </a>
      <SiteHeader />
      <main id="contenu" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
