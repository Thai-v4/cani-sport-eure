"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import supabase from "@/lib/supabaseClient";
import { passwordError } from "@/lib/password";
import AuthFrame, { FormAlert } from "../components/account/AuthFrame";
import PasswordField from "../components/account/PasswordField";

type LinkState = "checking" | "valid" | "invalid";

export default function NewPasswordPage() {
  const router = useRouter();
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Le lien reçu par email ouvre une session de récupération :
  // - « token_hash » (modèle d'email Supabase recommandé) → vérification explicite ;
  // - « code » (flux PKCE) → échangé automatiquement par le client Supabase.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type") as EmailOtpType | null;

    const check = async () => {
      if (tokenHash && type === "recovery") {
        const { error: otpError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        setLinkState(otpError ? "invalid" : "valid");
        return;
      }
      const { data } = await supabase.auth.getSession();
      setLinkState(data.session ? "valid" : "invalid");
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setLinkState("valid");
    });
    check();
    return () => listener.subscription.unsubscribe();
  }, []);

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const weak = passwordError(password);
    if (weak) return setError(weak);
    if (password !== confirmPassword) return setError("Les deux mots de passe ne correspondent pas.");

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("Le mot de passe n'a pas pu être changé. Redemandez un lien et réessayez.");
      return;
    }
    await supabase.auth.signOut();
    setDone(true);
  };

  if (done) {
    return (
      <AuthFrame title="Mot de passe changé">
        <p className="text-lg text-ink-2">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
        <button type="button" onClick={() => router.push("/connexion")} className="btn-line mt-8">
          Se connecter
        </button>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title="Nouveau mot de passe">
      {linkState === "checking" && <p className="text-ink-2">Vérification du lien…</p>}

      {linkState === "invalid" && (
        <>
          <FormAlert>Ce lien n&apos;est plus valide ou a déjà servi.</FormAlert>
          <Link href="/mot-de-passe-oublie" className="btn-line">
            Demander un nouveau lien
          </Link>
        </>
      )}

      {linkState === "valid" && (
        <>
          {error && <FormAlert>{error}</FormAlert>}
          <form onSubmit={handleUpdate} className="space-y-5">
            <PasswordField
              id="mot-de-passe"
              label="Nouveau mot de passe"
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
            <button type="submit" disabled={loading} className="btn-line w-full">
              {loading ? "Enregistrement…" : "Enregistrer le mot de passe"}
            </button>
          </form>
        </>
      )}
    </AuthFrame>
  );
}
