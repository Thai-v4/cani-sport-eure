"use client";
import Link from "next/link";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../../components/Auth/AuthProvider"; // ✅ Utilisation du contexte
import BlueBackground from "../backgrounds/BlueBackground";
import LogoutButton from "../Auth/LogoutButton";

export default function Sidebar() {
  const { user, role } = useAuth();

  const pathname = usePathname();

  return (
    <>
      {/* Bouton d'ouverture de la sidebar */}
      <button
        className="fixed top-4 right-4 primary_button shadow-lg transition p-2 z-9999"
        onClick={() => {
          document
            .getElementById("sidebar")
            ?.classList.toggle("translate-x-full");
        }}
      >
        <Image
          src="/icons/align-right.svg"
          alt="Menu"
          className="w-6 h-6"
          width={100}
          height={100}
        />
      </button>

      {/* Sidebar */}
      <div
        id="sidebar"
        className="fixed top-0 right-0 h-full w-64 shadow-lg transform translate-x-full transition-transform duration-300 z-9999 border-l-2 border-black"
      >
        <div className="absolute inset-0 z-9998">
          <BlueBackground maxSize />
        </div>

        <div className="relative z-9999 flex flex-col items-center mt-16 space-y-4">
          <button
            className="absolute top-0 right-0 translate-y-[-90%] p-2 drop-shadow-lg"
            onClick={() => {
              document
                .getElementById("sidebar")
                ?.classList.add("translate-x-full");
            }}
          >
            <Image
              src="/icons/cross.svg"
              alt="Fermer"
              width={24}
              height={24}
              className="filter invert"
            />
          </button>

          <ul className="primary_sidebar tracking-wide space-y-4 text-center">
            <li>
              <Link
                href="/#accueil"
                className={`hover:text-gray-300 ${pathname === "/accueil" ? "font-bold" : ""}`}
              >
                Le Club
              </Link>
            </li>
            <li>
              <Link
                href="/articles"
                className={`hover:text-gray-300 ${pathname === "/articles" ? "font-bold" : ""}`}
              >
                Articles
              </Link>
            </li>
            <li>
              <Link
                href="/listeEvenement"
                className={`hover:text-gray-300 ${pathname === "/listeEvenement" ? "font-bold" : ""}`}
              >
                Événements
              </Link>
            </li>
            <li>
              <Link
                href="/SortieCanine"
                className={`hover:text-gray-300 ${pathname === "/SortieCanine" ? "font-bold" : ""}`}
              >
                Catalogue des sorties
              </Link>
            </li>
            <li>
              <a
                href="https://sublimtout.com/200-canisports-eure"
                className="hover:text-gray-300"
              >
                Boutique
              </a>
            </li>
            <li>
              <a
                href="https://courses.ffslc.fr/license-ffslc-subscribe"
                className="hover:text-gray-300"
              >
                Prendre une licence
              </a>
            </li>

            {/* ✅ Si connecté (adhérent ou admin) */}
            {(role === "adherent" || role === "admin") && (
              <>
                <li>
                  <Link
                    href="/album"
                    className={`hover:text-gray-300 ${pathname === "/album" ? "font-bold" : ""}`}
                  >
                    Album
                  </Link>
                </li>
                <li>
                  <Link
                    href="/agenda"
                    className={`hover:text-gray-300 ${pathname === "/agenda" ? "font-bold" : ""}`}
                  >
                    Agenda
                  </Link>
                </li>
                <li>
                  <Link
                    href="/resultats"
                    className={`hover:text-gray-300 ${pathname === "/resultats" ? "font-bold" : ""}`}
                  >
                    Resultats
                  </Link>
                </li>
                <li>
                  <Link
                    href="/creation-profil"
                    className={`hover:text-gray-300 ${pathname === "/creation-profil" ? "font-bold" : ""}`}
                  >
                    Mon profil
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/client"
                    className={`hover:text-gray-300 ${pathname === "/dashboard/client" ? "font-bold" : ""}`}
                  >
                    Tableau de bord
                  </Link>
                </li>
              </>
            )}

            {/* ✅ Si admin */}
            {role === "admin" && (
              <>
                <li>
                  <Link
                    href="/Document"
                    className={`hover:text-gray-300 ${pathname === "/Document" ? "font-bold" : ""}`}
                  >
                    Documents
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/admin" className="hover:text-gray-300">
                    Admin
                  </Link>
                </li>
              </>
            )}

            {/* 🔒 Se connecter / Se déconnecter */}
            {!user && (
              <li>
                <Link
                  href="/connexion"
                  className={`hover:text-yellow_primary ${pathname === "/dashboard/client" ? "font-bold" : ""}`}
                >
                  Se connecter
                </Link>
              </li>
            )}
            {user && (
              <li>
                <LogoutButton />
              </li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
}
