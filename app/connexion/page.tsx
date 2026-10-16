"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { getRole } from "@/lib/roles";
import { useAuth } from "../components/Auth/AuthProvider";
import AuthFrame, { FormAlert } from "../components/account/AuthFrame";
import PasswordField from "../components/account/PasswordField";

const ERRORS: Record<string, string> = {
  "Invalid login credentials": "Email ou mot de passe incorrect.",
  "Email not confirmed": "Votre adresse email n'est pas encore confirmée.",
};

export default function LoginPage() {
  const router = useRouter();
  const { role, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Purge des mots de passe enregistrés par les anciennes versions du site
    localStorage.removeItem("rememberedPassword");
    // Seul l'email est mémorisé, jamais le mot de passe
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Déjà connecté : on renvoie vers l'espace correspondant
  useEffect(() => {
    if (isLoading) return;
    if (role === "admin") router.replace("/dashboard/admin");
    else if (role === "adherent") router.replace("/dashboard/client");
  }, [role, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.session) {
      setError(ERRORS[signInError?.message ?? ""] ?? "La connexion a échoué. Vérifiez vos informations et réessayez.");
      setLoading(false);
      return;
    }

    if (rememberMe) localStorage.setItem("rememberedEmail", email);
    else localStorage.removeItem("rememberedEmail");

    // Rôle lu dans app_metadata, non modifiable par l'utilisateur
    const userRole = getRole(data.session.user);
    if (userRole === "admin") {
      router.push("/dashboard/admin");
    } else if (userRole === "adherent") {
      router.push("/dashboard/client");
    } else {
      // Compte en attente de validation : pas de session ouverte
      await supabase.auth.signOut();
      setError("Votre compte attend la validation du bureau du club. Vous pourrez vous connecter ensuite.");
      setLoading(false);
    }
  };

  return (
    <AuthFrame title="Se connecter" description="Espace adhérent : calendrier du club, résultats, album photo et documents.">
      {error && <FormAlert>{error}</FormAlert>}

      <form onSubmit={handleLogin} className="space-y-5">
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

        <PasswordField
          id="mot-de-passe"
          label="Mot de passe"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 accent-line"
            />
            Se souvenir de mon email
          </label>
          <Link href="/mot-de-passe-oublie" className="link-line text-sm">
            Mot de passe oublié ?
          </Link>
        </div>

        <button type="submit" disabled={loading} className="btn-line w-full">
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className="mt-10 border-t border-rule pt-6 text-ink-2">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="link-line">
          Créer un compte adhérent
        </Link>
      </p>
    </AuthFrame>
  );
}
