"use client"; // Indique que ce composant s'exécute côté client

import { useEffect, useState } from "react"; // Import des hooks React
import supabase from "@/lib/supabaseClient"; // Client Supabase
import { useRouter } from "next/navigation"; // Hook de navigation Next.js
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Icônes pour afficher/masquer le mot de passe

export default function NouveauMotDePassePage() {
  // Initialisation du client Supabase et du router
  const router = useRouter();

  // États pour les champs de formulaire
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null); // Message de succès
  const [error, setError] = useState<string | null>(null); // Message d'erreur
  const [loading, setLoading] = useState(false); // État de chargement

  // États pour l'affichage/masquage des mots de passe
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Récupération et validation du token depuis l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access_token = params.get("access_token");
    const type = params.get("type");

    if (access_token && type === "recovery") {
      // Configuration de la session avec le token de récupération
      supabase.auth.setSession({
        access_token,
        refresh_token: "",
      });

      // Écoute des changements d'état d'authentification
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
        }
      );

      // Nettoyage de l'écouteur lors du démontage du composant
      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [supabase]);

  // Vérifier la session au chargement
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Erreur de session:", error);
        setError(
          "Le lien a peut-être expiré. Veuillez redemander un nouveau lien."
        );
        return;
      }

      if (!session) {
        setError(
          "Session invalide. Veuillez redemander un nouveau lien de réinitialisation."
        );
      }
    };

    checkSession();
  }, [supabase]);

  // Gestion de la soumission du formulaire
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault(); // Empêche le rechargement de la page
    setError(null);
    setMessage(null);

    // Validation du mot de passe
    const hasNumber = /\d/.test(password); // Vérifie s'il contient un chiffre
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password); // Vérifie s'il contient un caractère spécial

    // Vérification de la longueur minimale
    if (password.length < 12) {
      setError("Le mot de passe doit contenir au moins 12 caractères.");
      return;
    }

    // Vérification des exigences de complexité
    if (!hasNumber || !hasSpecialChar) {
      setError(
        "Le mot de passe doit contenir au moins un chiffre et un caractère spécial."
      );
      return;
    }

    // Vérification de la correspondance des mots de passe
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    // Mise à jour du mot de passe via Supabase
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      console.error("Erreur de mise à jour:", error);
      setError("Une erreur est survenue. Le lien a peut-être expiré.");
    } else {
      // Affichage du message de succès et redirection
      setMessage("Mot de passe mis à jour avec succès !");
      setTimeout(() => router.push("/connexion"), 2000); // Redirection après 2 secondes
    }
  };

  // Interface utilisateur du formulaire
  return (
    <div className="flex items-center justify-center h-screen bg-blue-900">
      <div className="card w-full max-w-sm bg-white shadow-xl p-6 md:p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          Nouveau mot de passe
        </h2>

        {/* Affichage des messages de succès ou d'erreur */}
        {message && (
          <div className="alert alert-success shadow-lg mb-4">
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="alert alert-error shadow-lg mb-4">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword}>
          {/* Champ de nouveau mot de passe avec toggle visibilité */}
          <div className="form-control mb-4">
            <label className="label">
              <span>Nouveau mot de passe</span>
            </label>
            <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 focus-within:border-blue-500">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white flex-1 py-3 focus:outline-hidden"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-gray-600 hover:text-gray-800"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Champ de confirmation avec toggle visibilité */}
          <div className="form-control mb-4">
            <label className="label">
              <span>Confirmer le mot de passe</span>
            </label>
            <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 focus-within:border-blue-500">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-white flex-1 py-3 focus:outline-hidden"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="text-gray-600 hover:text-gray-800"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Bouton de soumission avec état de chargement */}
          <button
            type="submit"
            className={`btn btn-primary w-full ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? "Mise à jour..." : "Changer le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}
