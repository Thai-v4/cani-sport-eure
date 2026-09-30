"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { useAuth } from "../Auth/AuthProvider";

const PUBLIC_LINKS = [
  { href: "/#club", label: "Le club", match: "/#club" },
  { href: "/SortieCanine", label: "Sorties", match: "/SortieCanine" },
  { href: "/listeEvenement", label: "Agenda", match: "/listeEvenement" },
  { href: "/articles", label: "Articles", match: "/articles" },
];

const MEMBER_LINKS = [
  { href: "/dashboard/client", label: "Mon espace" },
  { href: "/agenda", label: "Calendrier du club" },
  { href: "/resultats", label: "Résultats" },
  { href: "/album", label: "Album photo" },
  { href: "/Document", label: "Documents" },
  { href: "/creation-profil", label: "Mon profil" },
];

function isActive(pathname: string, match: string) {
  if (match.startsWith("/#")) return false;
  return pathname === match || pathname.startsWith(`${match}/`);
}

export default function SiteHeader() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { user, role, logout } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const isMember = role === "admin" || role === "adherent";
  const firstName = (user?.user_metadata?.first_name as string | undefined) || "Mon compte";

  // Fermeture des menus au changement de page
  useEffect(() => {
    setSheetOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  // Feuille mobile : pas de défilement derrière, Échap pour fermer
  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  // Menu compte : clic extérieur et Échap
  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAccountOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper">
      <div className="site-container flex h-16 items-center gap-8">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Cani-Sports Eure, accueil">
          <Image src="/logo-noir-SansFond.png" alt="" width={40} height={40} priority className="size-10" />
          <span className="hidden text-[1.0625rem] font-bold tracking-tight [font-variation-settings:'wdth'_84] sm:inline">
            Cani-Sports Eure
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {PUBLIC_LINKS.map((link) => {
              const active = isActive(pathname, link.match);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className="relative block py-5 text-[0.9375rem] font-medium text-ink-2 transition-colors hover:text-ink aria-[current=page]:text-ink"
                  >
                    {link.label}
                    {active && <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-line" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {!user && (
            <Link href="/connexion" className="hidden px-3 py-2 text-[0.9375rem] font-medium text-ink md:block">
              Se connecter
            </Link>
          )}

          {user && (
            <div ref={accountRef} className="relative hidden md:block">
              <button
                type="button"
                aria-expanded={accountOpen}
                aria-haspopup="true"
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-2 text-[0.9375rem] font-medium text-ink"
              >
                {firstName}
                <ChevronDown aria-hidden className={`size-4 transition-transform ${accountOpen ? "rotate-180" : ""}`} />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 border border-rule bg-paper py-2 shadow-overlay">
                  <AccountLinks isMember={isMember} isAdmin={role === "admin"} onLogout={handleLogout} />
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="flex items-center gap-2 px-2 py-2 text-[0.9375rem] font-medium md:hidden"
            aria-expanded={sheetOpen}
            aria-controls="menu-mobile"
            onClick={() => setSheetOpen(true)}
          >
            <Menu aria-hidden className="size-5" />
            Menu
          </button>
        </div>
      </div>

      {sheetOpen && (
        <div
          id="menu-mobile"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-paper md:hidden"
        >
          <div className="site-container flex h-16 shrink-0 items-center justify-between border-b border-rule">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo-noir-SansFond.png" alt="" width={40} height={40} className="size-10" />
              <span className="font-bold [font-variation-settings:'wdth'_84]">Cani-Sports Eure</span>
            </Link>
            <button
              type="button"
              autoFocus
              onClick={() => setSheetOpen(false)}
              className="flex items-center gap-2 px-2 py-2 font-medium"
            >
              <X aria-hidden className="size-5" />
              Fermer
            </button>
          </div>
          <nav aria-label="Navigation principale" className="site-container py-6">
            <ul className="divide-y divide-rule">
              {PUBLIC_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setSheetOpen(false)}
                    aria-current={isActive(pathname, link.match) ? "page" : undefined}
                    className="display block py-4 text-4xl aria-[current=page]:text-line"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 border-t border-ink pt-6">
              {user ? (
                <AccountLinks isMember={isMember} isAdmin={role === "admin"} onLogout={handleLogout} large />
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/connexion" className="btn-quiet w-full">
                    Se connecter
                  </Link>
                  <Link href="/inscription" className="btn-line w-full">
                    Créer un compte adhérent
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function AccountLinks({
  isMember,
  isAdmin,
  onLogout,
  large = false,
}: {
  isMember: boolean;
  isAdmin: boolean;
  onLogout: () => void;
  large?: boolean;
}) {
  const itemClass = large
    ? "block py-3 text-lg font-medium"
    : "block px-4 py-2 text-[0.9375rem] text-ink-2 hover:bg-wash hover:text-ink";

  return (
    <ul>
      {isMember ? (
        MEMBER_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={itemClass}>
              {link.label}
            </Link>
          </li>
        ))
      ) : (
        <li className={large ? "py-3 text-ink-2" : "px-4 py-2 text-sm text-ink-2"}>
          Votre compte attend la validation du bureau.
        </li>
      )}
      {isAdmin && (
        <li>
          <Link href="/dashboard/admin" className={`${itemClass} font-semibold text-line`}>
            Administration
          </Link>
        </li>
      )}
      <li className={large ? "mt-2 border-t border-rule pt-2" : "mt-2 border-t border-rule pt-2"}>
        <button type="button" onClick={onLogout} className={`${itemClass} w-full text-left`}>
          Se déconnecter
        </button>
      </li>
    </ul>
  );
}
