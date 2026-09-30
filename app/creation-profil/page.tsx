"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Camera, Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import supabase from "@/lib/supabaseClient";
import { useAuth } from "@/app/components/Auth/AuthProvider";
import PageHeader from "../components/site/PageHeader";
import { FormAlert } from "../components/account/AuthFrame";

type Profile = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  code_postal: string;
  ville: string;
  photo_profil: string;
  date_de_naissance: string;
  licence: string;
};

const EMPTY: Profile = {
  id: "",
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  adresse: "",
  code_postal: "",
  ville: "",
  photo_profil: "",
  date_de_naissance: "",
  licence: "",
};

const MAX_PHOTO = 5 * 1024 * 1024;

function ageFrom(date: string) {
  if (!date) return null;
  const birth = new Date(date);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState<Profile>(EMPTY);
  const [dogs, setDogs] = useState<{ id: string; prenom: string }[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [communes, setCommunes] = useState<string[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: profile, error }, { data: dogsData }] = await Promise.all([
        supabase.from("profils").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("chiens").select("id, prenom").eq("id_profil", user.id),
      ]);
      if (error) {
        setStatus("error");
        return;
      }
      // Profil absent : on part des informations du compte
      const base = { ...EMPTY, id: user.id, email: user.email ?? "" };
      const merged = { ...base, ...Object.fromEntries(Object.entries(profile ?? {}).filter(([, v]) => v !== null)) } as Profile;
      setForm(merged);
      setPreview(merged.photo_profil || null);
      setDogs(dogsData ?? []);
      setStatus("ready");
    };
    load();
  }, [user]);

  const update = (name: keyof Profile, value: string) => setForm((prev) => ({ ...prev, [name]: value }));

  // Ville proposée à partir du code postal (API officielle geo.api.gouv.fr)
  const handlePostalCode = async (value: string) => {
    update("code_postal", value);
    setCommunes([]);
    if (!/^\d{5}$/.test(value)) return;
    try {
      const res = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${value}&fields=nom&format=json`);
      const data: { nom: string }[] = await res.json();
      const names = data.map((c) => c.nom);
      setCommunes(names);
      if (names.length === 1) update("ville", names[0]);
    } catch {
      // Saisie manuelle de la ville si l'API ne répond pas
    }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ tone: "error", text: "Choisissez une image (JPEG, PNG ou WebP)." });
      return;
    }
    if (file.size > MAX_PHOTO) {
      setMessage({ tone: "error", text: "La photo dépasse 5 Mo. Choisissez une image plus légère." });
      return;
    }
    setMessage(null);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    let photoUrl = form.photo_profil;
    if (photo) {
      const safeName = photo.name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const { data, error } = await supabase.storage.from("images").upload(`profils/${uuidv4()}-${safeName}`, photo);
      if (error) {
        setMessage({ tone: "error", text: "La photo n'a pas pu être envoyée. Réessayez ou choisissez une autre image." });
        setSaving(false);
        return;
      }
      photoUrl = supabase.storage.from("images").getPublicUrl(data.path).data.publicUrl;
    }

    const { error } = await supabase.from("profils").upsert([{ ...form, id: user.id, photo_profil: photoUrl }]);
    setSaving(false);
    if (error) {
      setMessage({ tone: "error", text: "L'enregistrement a échoué. Vérifiez les champs et réessayez." });
    } else {
      setPhoto(null);
      update("photo_profil", photoUrl);
      setMessage({ tone: "success", text: "Profil enregistré." });
    }
  };

  const age = ageFrom(form.date_de_naissance);
  const text = (name: keyof Profile, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`profil-${name}`} className="field-label">
        {label}
      </label>
      <input
        id={`profil-${name}`}
        value={form[name]}
        onChange={(e) => update(name, e.target.value)}
        className="field"
        {...props}
      />
    </div>
  );

  return (
    <>
      <PageHeader title="Mon profil" description="Vos coordonnées et votre licence, visibles uniquement par vous et le bureau du club." />

      <div className="site-container pb-24">
        {status === "loading" && <p className="text-ink-2">Chargement du profil…</p>}
        {status === "error" && <FormAlert>Le profil ne se charge pas pour le moment. Réessayez un peu plus tard.</FormAlert>}

        {status === "ready" && (
          <form onSubmit={handleSubmit} className="grid gap-12 border-t border-ink pt-10 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <div className="relative aspect-square w-40 overflow-hidden bg-wash lg:w-full">
                {preview ? (
                  <Image src={preview} alt="Votre photo de profil" fill sizes="16rem" className="object-cover" unoptimized={preview.startsWith("blob:")} />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-sm text-ink-3">Pas de photo</span>
                )}
              </div>
              <input ref={fileInput} id="photo" type="file" accept="image/*" onChange={handlePhoto} className="sr-only" />
              <button type="button" onClick={() => fileInput.current?.click()} className="btn-quiet mt-4">
                <Camera aria-hidden className="size-4" />
                {preview ? "Changer la photo" : "Ajouter une photo"}
              </button>
            </div>

            <div className="lg:col-span-9">
              {message && <FormAlert tone={message.tone}>{message.text}</FormAlert>}

              <fieldset className="grid gap-5 sm:grid-cols-2">
                <legend className="mb-5 text-sm font-semibold">Identité</legend>
                {text("prenom", "Prénom", { autoComplete: "given-name", required: true })}
                {text("nom", "Nom", { autoComplete: "family-name", required: true })}
                {text("date_de_naissance", "Date de naissance", { type: "date", autoComplete: "bday" })}
                {text("telephone", "Téléphone", { type: "tel", autoComplete: "tel" })}
              </fieldset>

              <fieldset className="mt-10 grid gap-5 sm:grid-cols-2">
                <legend className="mb-5 text-sm font-semibold">Adresse</legend>
                <div className="sm:col-span-2">{text("adresse", "Adresse", { autoComplete: "street-address" })}</div>
                <div>
                  <label htmlFor="profil-code_postal" className="field-label">
                    Code postal
                  </label>
                  <input
                    id="profil-code_postal"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={5}
                    value={form.code_postal}
                    onChange={(e) => handlePostalCode(e.target.value)}
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="profil-ville" className="field-label">
                    Ville
                  </label>
                  <input
                    id="profil-ville"
                    list="communes"
                    autoComplete="address-level2"
                    value={form.ville}
                    onChange={(e) => update("ville", e.target.value)}
                    className="field"
                  />
                  <datalist id="communes">
                    {communes.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </fieldset>

              <fieldset className="mt-10 grid gap-5 sm:grid-cols-2">
                <legend className="mb-5 text-sm font-semibold">Licence et compte</legend>
                <div>
                  <label htmlFor="profil-licence" className="field-label">
                    Licence
                  </label>
                  <select id="profil-licence" value={form.licence} onChange={(e) => update("licence", e.target.value)} className="field">
                    <option value="">Choisir une licence</option>
                    {age === null || age >= 17 ? (
                      <>
                        <option value="loisir_adulte">Loisir adulte</option>
                        <option value="loisir_adulte_handisport">Loisir adulte handisport</option>
                        <option value="competition_adulte">Compétition adulte</option>
                        <option value="competition_adulte_handisport">Compétition adulte handisport</option>
                      </>
                    ) : (
                      <option value="Licence enfant">Licence enfant</option>
                    )}
                  </select>
                  <p className="field-hint">Les licences proposées dépendent de votre âge.</p>
                </div>
                <div>
                  <label htmlFor="profil-email" className="field-label">
                    Email
                  </label>
                  <input id="profil-email" value={form.email} readOnly className="field bg-wash text-ink-2" />
                  <p className="field-hint">Pour changer d&apos;email, écrivez au bureau.</p>
                </div>
              </fieldset>

              <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-rule pt-6">
                <button type="submit" disabled={saving} className="btn-line">
                  {saving ? "Enregistrement…" : "Enregistrer le profil"}
                </button>
              </div>

              <section aria-labelledby="titre-chiens" className="mt-16">
                <div className="flex items-end justify-between gap-4">
                  <h2 id="titre-chiens" className="display text-3xl">
                    Mes chiens
                  </h2>
                  <Link href="/creation-chien" className="btn-quiet">
                    <Plus aria-hidden className="size-4" />
                    Ajouter un chien
                  </Link>
                </div>
                {dogs.length === 0 ? (
                  <p className="mt-4 border-t border-ink pt-5 text-ink-2">Aucun chien enregistré pour l&apos;instant.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-rule border-t border-ink">
                    {dogs.map((dog) => (
                      <li key={dog.id}>
                        <Link href={`/creation-chien/${dog.id}`} className="flex items-center justify-between py-4 font-semibold hover:text-line">
                          {dog.prenom}
                          <span className="text-sm font-normal text-ink-3">Modifier</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
