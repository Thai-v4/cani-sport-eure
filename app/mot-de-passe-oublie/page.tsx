"use client"; // Directive pour exécution côté client

import { useState } from "react"; // Hook d'état React
import supabase from "@/lib/supabaseClient"; // Client Supabase
import Link from "next/link"; // Navigation entre pages

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); // État pour l'email saisi
  const [message, setMessage] = useState<string | null>(null); // Message de succès
  const [error, setError] = useState<string | null>(null); // Message d'erreur
  const [loading, setLoading] = useState(false); // État de chargement

  // Gestion de la demande de réinitialisation
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    // Utilisation de la variable d'environnement
    const redirectUrl =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    // Appel API Supabase pour demander la réinitialisation
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectUrl}/nouveau-mot-de-passe`,
    });

    setLoading(false);

    // Affichage du résultat (succès ou erreur)
    if (error) {
      console.error("Erreur de réinitialisation:", error);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } else {
      setMessage(
        "Un e-mail de réinitialisation a été envoyé. Vérifiez votre boîte de réception."
      );
    }
  };

  // Interface utilisateur
  return (
    <div className="flex items-center justify-center h-screen bg-blue-900">
      <div className="card w-full max-w-sm bg-white shadow-xl p-6 md:p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          Mot de passe oublié
        </h2>

        {/* Messages de feedback */}
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

        {/* Formulaire de saisie d'email */}
        <form onSubmit={handlePasswordReset}>
          <div className="form-control mb-4">
            <label className="label">
              <span>Adresse e-mail</span>
            </label>
            <input
              type="email"
              placeholder="Votre adresse e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered input-primary w-full"
              required
            />
          </div>

          {/* Bouton d'envoi avec état de chargement */}
          <button
            type="submit"
            className={`btn btn-primary w-full ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? "Envoi en cours..." : "Envoyer un e-mail"}
          </button>
        </form>

        {/* Lien de retour vers la page de connexion */}
        <div className="mt-6 text-center">
          <Link
            href="/connexion"
            className="text-sm underline text-blue-500 hover:text-blue-700"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
