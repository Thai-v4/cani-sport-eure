"use client";

import Link from "next/link";
import { useState } from "react";
import { passwordError } from "@/lib/password";
import AuthFrame, { FormAlert } from "../components/account/AuthFrame";
import PasswordField from "../components/account/PasswordField";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const weak = passwordError(password);
    if (weak) return setError(weak);
    if (password !== confirmPassword) return setError("Les deux mots de passe ne correspondent pas.");
    if (!consent) return setError("Merci d'accepter la politique de confidentialité pour créer votre compte.");

    setLoading(true);
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "L'inscription a échoué. Réessayez dans quelques minutes.");
      } else {
        setDone(true);
      }
    } catch {
      setError("Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthFrame title="Demande envoyée">
        <p className="text-lg text-ink-2">
          Votre compte est créé. Le bureau du club doit maintenant valider votre inscription : vous pourrez vous
          connecter dès que c&apos;est fait.
        </p>
        <Link href="/connexion" className="btn-line mt-8">
          Aller à la connexion
        </Link>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="Créer un compte adhérent"
      description="Le compte donne accès au calendrier complet, aux résultats et à l'album photo, après validation par le bureau."
    >
      {error && <FormAlert>{error}</FormAlert>}

      <form onSubmit={handleSignup} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="prenom" className="field-label">
              Prénom
            </label>
            <input
              id="prenom"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="nom" className="field-label">
              Nom
            </label>
            <input
              id="nom"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="field"
            />
          </div>
        </div>

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
          autoComplete="new-password"
          showRules
        />

        <div>
          <PasswordField
            id="confirmation"
            label="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            invalid={mismatch}
            describedBy={mismatch ? "confirmation-erreur" : undefined}
          />
          {mismatch && (
            <p id="confirmation-erreur" className="field-error">
              Les deux mots de passe ne correspondent pas.
            </p>
          )}
        </div>

        <label className="flex items-start gap-3 text-sm text-ink-2">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-line"
          />
          <span>
            J&apos;accepte la{" "}
            <Link href="/politique-confidentialite" target="_blank" className="link-line">
              politique de confidentialité
            </Link>{" "}
            du club.
          </span>
        </label>

        <button type="submit" disabled={loading} className="btn-line w-full">
          {loading ? "Création du compte…" : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-10 border-t border-rule pt-6 text-ink-2">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="link-line">
          Se connecter
        </Link>
      </p>
    </AuthFrame>
  );
}
