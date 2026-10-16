"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, LogOut, Menu, Plus, X } from "lucide-react";
import { useAuth } from "./Auth/AuthProvider";

interface SidebarAdminProps {
  onAdd?: () => void;
}

const MENU = [
  { name: "Tableau de bord", path: "/dashboard/admin" },
  { name: "Adhérents", path: "/dashboard/admin/adherents" },
  { name: "Événements", path: "/evenements" },
  { name: "Agenda", path: "/agendaAdmin" },
  { name: "Sorties", path: "/catalogue" },
  { name: "Résultats", path: "/resultatAdmin" },
  { name: "Articles", path: "/articleAdmin" },
  { name: "Albums", path: "/AlbumManager" },
  { name: "Documents", path: "/DocumentManager" },
];

const ADD_LABELS: Record<string, string> = {
  "/evenements": "Nouvel événement",
  "/articleAdmin": "Nouvel article",
  "/catalogue": "Nouvelle sortie",
  "/resultatAdmin": "Nouveau résultat",
};

// Coque de l'administration : colonne de navigation sobre ; le lien actif est
// désigné par un segment de la ligne bleue.
export default function SidebarAdmin({ onAdd }: SidebarAdminProps) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const addLabel = ADD_LABELS[pathname];

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const content = (
    <div className="flex h-full flex-col">
      <Link href="/dashboard/admin" className="flex items-center gap-3 px-6 pb-6 pt-6">
        <Image src="/logo-noir-SansFond.png" alt="" width={36} height={36} className="size-9" />
        <span className="leading-tight">
          <span className="block text-sm font-bold [font-variation-settings:'wdth'_84]">Cani-Sports Eure</span>
          <span className="block text-xs text-ink-3">Administration</span>
        </span>
      </Link>

      <nav aria-label="Administration" className="flex-1 overflow-y-auto px-3">
        <ul>
          {MENU.map(({ name, path }) => {
            const active = pathname === path;
            return (
              <li key={path}>
                <Link
                  href={path}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 text-[0.9375rem] ${
                    active ? "font-semibold text-ink" : "text-ink-2 hover:bg-wash hover:text-ink"
                  }`}
                >
                  <span aria-hidden className={`h-0.5 w-3 shrink-0 ${active ? "bg-line" : "bg-transparent"}`} />
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-1 border-t border-rule px-3 py-4">
        {onAdd && addLabel && (
          <button type="button" onClick={onAdd} className="btn-line mb-3 w-full">
            <Plus aria-hidden className="size-4" />
            {addLabel}
          </button>
        )}
        <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-ink-2 hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" />
          Retour au site
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-2 hover:text-ink"
        >
          <LogOut aria-hidden className="size-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-rule bg-paper md:block">{content}</aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="menu-admin"
        className="fixed right-3 top-3 z-40 flex items-center gap-2 border border-rule bg-paper px-3 py-2 text-sm font-medium md:hidden"
      >
        <Menu aria-hidden className="size-4" />
        Menu
      </button>

      {open && (
        <div id="menu-admin" role="dialog" aria-modal="true" aria-label="Menu d'administration" className="fixed inset-0 z-50 md:hidden">
          <button type="button" aria-label="Fermer le menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/30" />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-paper shadow-overlay">
            <button
              type="button"
              autoFocus
              onClick={() => setOpen(false)}
              className="absolute right-3 top-5 flex items-center gap-1 p-2 text-sm"
            >
              <X aria-hidden className="size-4" />
              Fermer
            </button>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
