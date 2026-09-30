"use client";

import Link from "next/link";
import { useState } from "react";
import supabase from "@/lib/supabaseClient";
import AuthFrame, { FormAlert } from "../components/account/AuthFrame";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/nouveau-mot-de-passe`,
    });

    setLoading(false);
    if (resetError) {
      setError("L'envoi a échoué. Réessayez dans quelques minutes.");
    } else {
      setSent(true);
    }
  };

  return (
    <AuthFrame
      title="Mot de passe oublié"
      description="Indiquez l'email de votre compte : nous vous envoyons un lien pour choisir un nouveau mot de passe."
    >
      {sent ? (
        <>
          {/* Message identique que le compte existe ou non (pas d'énumération des comptes) */}
          <FormAlert tone="success">
            Si un compte existe pour {email}, un email vient d&apos;être envoyé.
          </FormAlert>
          <Link href="/connexion" className="link-line">
            Retour à la connexion
          </Link>
        </>
      ) : (
        <>
          {error && <FormAlert>{error}</FormAlert>}
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-line w-full">
              {loading ? "Envoi…" : "Recevoir le lien"}
            </button>
          </form>
          <p className="mt-10 border-t border-rule pt-6">
            <Link href="/connexion" className="link-line">
              Retour à la connexion
            </Link>
          </p>
        </>
      )}
    </AuthFrame>
  );
}
