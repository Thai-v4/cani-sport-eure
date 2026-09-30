"use client"; // Indique que ce composant s'exécute côté client

import { useState, useEffect } from "react"; // Hooks React
import { useRouter } from "next/navigation"; // Navigation entre pages
import Image from "next/image"; // Composant d'image optimisé
import Link from "next/link"; // Navigation entre pages
import supabase from "@/lib/supabaseClient"; // Client Supabase
import { getRole } from "@/lib/roles";
import Sidebar from "../components/sidebars/Sidebar"; // Barre latérale
import { useAuth } from "../components/Auth/AuthProvider"; // Contexte d'authentification

export default function LoginPage() {
  const router = useRouter(); // Router pour la navigation
  const { role, isLoading } = useAuth(); // Récupération du rôle utilisateur

  // États pour le formulaire
  const [email, setEmail] = useState(""); // Email de l'utilisateur
  const [password, setPassword] = useState(""); // Mot de passe
  const [rememberMe, setRememberMe] = useState(false); // Option se souvenir de moi
  const [loading, setLoading] = useState(false); // État de chargement
  const [error, setError] = useState<string | null>(null); // Message d'erreur
  const [showPassword, setShowPassword] = useState(false); // Afficher le mot de passe
  const [isClient, setIsClient] = useState(false); // Vérification du rendu côté client

  // Récupération des identifiants enregistrés au chargement
  useEffect(() => {
    setIsClient(true); // Marque que le composant est chargé côté client

    // Purge des mots de passe enregistrés par les anciennes versions du site
    localStorage.removeItem("rememberedPassword");

    // Seul l'email est mémorisé, jamais le mot de passe
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Redirection si déjà connecté
  useEffect(() => {
    if (!isLoading) {
      if (role === "admin") {
        router.push("/dashboard/admin"); // Redirection vers le dashboard admin
      } else if (role === "adherent") {
        router.push("/"); // Redirection vers la page d'accueil
      }
    }
  }, [role, isLoading]);

  // Traduction des messages d'erreur en français
  const translateError = (errorMessage: string): string => {
    switch (errorMessage) {
      case "Invalid login credentials":
        return "Identifiants de connexion invalides.";
      case "Email not confirmed":
        return "Votre adresse email n'a pas encore été confirmée.";
      case "User not found":
        return "Utilisateur non trouvé.";
      case "Password is incorrect":
        return "Le mot de passe est incorrect.";
      case "Email is required":
        return "L'email est requis.";
      case "Password is required":
        return "Le mot de passe est requis.";
      default:
        return "Une erreur est survenue. Veuillez réessayer.";
    }
  };

  // Gestion de la connexion
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Tentative de connexion avec Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(translateError(error.message));
      setLoading(false);
      return;
    }

    if (!data?.session) {
      setError("La connexion a échoué.");
      setLoading(false);
      return;
    }

    // Mémorisation de l'email uniquement si l'option est cochée
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    // Redirection selon le rôle (lu dans app_metadata, non modifiable par l'utilisateur)
    const role = getRole(data.session.user);
    if (role === "admin") {
      router.push("/dashboard/admin");
    } else if (role === "adherent") {
      router.push("/");
    } else {
      // Compte en attente de validation : pas de session ouverte
      await supabase.auth.signOut();
      setError("Votre compte n'est pas encore validé par le bureau du club.");
    }

    setLoading(false);
  };

  // Navigation vers la page d'inscription
  const redirectToSignup = () => {
    router.push("/inscription");
  };

  return (
    <div>
      {/* Arrière-plan avec image */}
      <div
        className="flex items-center justify-center h-screen bg-cover bg-center"
        style={{ backgroundImage: "url('/photos/MainPage_bg.jpg')" }}
      >
        <div className="flex flex-col md:flex-row items-center justify-center gap-32">
          {/* Logo (affiché uniquement sur desktop) */}
          {isClient && (
            <div className="hidden md:flex items-center justify-center">
              <Image
                src="/Logo-ContourBlanc-SansFond.png"
                alt="Logo Cani-Sports Eure"
                width={200}
                height={200}
                className="w-auto h-auto"
              />
            </div>
          )}

          {/* Formulaire de connexion */}
          <div className="card w-full max-w-sm bg-blue-900 bg-opacity-90 shadow-xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-center mb-6 text-white">
              Connexion
            </h2>
            <form onSubmit={handleLogin}>
              {/* Affichage des erreurs */}
              {error && (
                <div className="alert alert-error shadow-lg mb-4">
                  <span>{error}</span>
                </div>
              )}

              {/* Champ email */}
              <div className="form-control mb-4">
                <label className="label text-white">
                  <span>Email</span>
                </label>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-bordered input-primary w-full"
                  required
                />
              </div>

              {/* Champ mot de passe avec option de visibilité */}
              <div className="form-control mb-4">
                <label className="label text-white">
                  <span>Mot de passe</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input input-bordered input-primary w-full"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Option "Se souvenir de moi" */}
              <div className="form-control mb-4">
                <label className="cursor-pointer flex items-center gap-2 text-white">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="checkbox checkbox-primary border-white"
                  />
                  <span>Se souvenir de moi</span>
                </label>
              </div>

              {/* Bouton de connexion */}
              <button
                type="submit"
                className={`btn btn-primary w-full text-black bg-white border-none hover:bg-gray-100 ${
                  loading ? "loading" : ""
                }`}
                disabled={loading}
              >
                {loading ? "Connexion en cours..." : "Se connecter"}
              </button>
            </form>

            {/* Liens de navigation */}
            <div className="mt-6 text-center">
              <Link
                href="/mot-de-passe-oublie"
                className="text-sm underline text-white hover:text-blue-300"
              >
                Mot de passe oublié ?
              </Link>
              <p className="text-sm mt-2 text-white">
                Pas encore inscrit ?{" "}
                <button
                  onClick={redirectToSignup}
                  className="underline hover:text-blue-300"
                >
                  Inscription
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Sidebar /> {/* Barre latérale de navigation */}
    </div>
  );
}
