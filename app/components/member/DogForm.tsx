"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import supabase from "@/lib/supabaseClient";
import { useAuth } from "../Auth/AuthProvider";
import { FormAlert } from "../account/AuthFrame";

type Dog = {
  prenom: string;
  race: string;
  date_de_naissance: string;
  numero_de_puce: string;
  numero_de_tatouage: string;
  photo_chien: string;
};

const EMPTY: Dog = { prenom: "", race: "", date_de_naissance: "", numero_de_puce: "", numero_de_tatouage: "", photo_chien: "" };
const MAX_PHOTO = 5 * 1024 * 1024;

function ageFrom(date: string) {
  if (!date) return 0;
  const birth = new Date(date);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(age, 0);
}

// Fiche d'un chien, en création (dogId absent) ou en modification
export default function DogForm({ dogId }: { dogId?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState<Dog>(EMPTY);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(dogId ? "loading" : "ready");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dogId) return;
    supabase
      .from("chiens")
      .select("*")
      .eq("id", dogId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setStatus("missing");
          return;
        }
        setForm({
          prenom: data.prenom ?? "",
          race: data.race ?? "",
          date_de_naissance: data.date_de_naissance ?? "",
          numero_de_puce: data.numero_de_puce ?? "",
          numero_de_tatouage: data.numero_de_tatouage ?? "",
          photo_chien: data.photo_chien ?? "",
        });
        setPreview(data.photo_chien || null);
        setStatus("ready");
      });
  }, [dogId]);

  const update = (name: keyof Dog, value: string) => setForm((prev) => ({ ...prev, [name]: value }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choisissez une image (JPEG, PNG ou WebP).");
    if (file.size > MAX_PHOTO) return setError("La photo dépasse 5 Mo. Choisissez une image plus légère.");
    setError(null);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    if (form.numero_de_puce.length > 15) return setError("Le numéro de puce ne peut pas dépasser 15 caractères.");
    if (form.numero_de_tatouage && form.numero_de_tatouage.length < 6)
      return setError("Le numéro de tatouage doit contenir au moins 6 caractères.");

    setSaving(true);
    let photoUrl = form.photo_chien;
    if (photo) {
      const safeName = photo.name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
      const { data, error: uploadError } = await supabase.storage.from("images").upload(`chiens/${uuidv4()}-${safeName}`, photo);
      if (uploadError) {
        setSaving(false);
        return setError("La photo n'a pas pu être envoyée. Réessayez ou choisissez une autre image.");
      }
      photoUrl = supabase.storage.from("images").getPublicUrl(data.path).data.publicUrl;
    }

    const { error: saveError } = await supabase.from("chiens").upsert([
      { id: dogId ?? uuidv4(), ...form, age: ageFrom(form.date_de_naissance), photo_chien: photoUrl, id_profil: user.id },
    ]);
    setSaving(false);
    if (saveError) return setError("L'enregistrement a échoué. Vérifiez les champs et réessayez.");
    router.push("/creation-profil");
  };

  const handleDelete = async () => {
    if (!dogId) return;
    const { error: deleteError } = await supabase.from("chiens").delete().eq("id", dogId);
    if (deleteError) return setError("La suppression a échoué. Réessayez.");
    router.push("/creation-profil");
  };

  const field = (name: keyof Dog, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => (
    <div>
      <label htmlFor={`chien-${name}`} className="field-label">
        {label}
      </label>
      <input id={`chien-${name}`} value={form[name]} onChange={(e) => update(name, e.target.value)} className="field" {...props} />
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );

  return (
    <div className="site-container pb-24 pt-10">
      <Link href="/creation-profil" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" />
        Mon profil
      </Link>
      <h1 className="display mt-6 text-[clamp(2.5rem,5vw,4rem)]">
        {dogId ? form.prenom || "Mon chien" : "Ajouter un chien"}
      </h1>

      {status === "loading" && <p className="mt-10 text-ink-2">Chargement…</p>}
      {status === "missing" && (
        <div className="mt-10">
          <FormAlert>Ce chien est introuvable ou ne vous appartient pas.</FormAlert>
        </div>
      )}

      {status === "ready" && (
        <form onSubmit={handleSubmit} className="mt-10 grid gap-12 border-t border-ink pt-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="relative aspect-square w-40 overflow-hidden bg-wash lg:w-full">
              {preview ? (
                <Image src={preview} alt={`Photo de ${form.prenom || "votre chien"}`} fill sizes="16rem" className="object-cover" unoptimized={preview.startsWith("blob:")} />
              ) : (
                <span className="absolute inset-0 grid place-items-center text-sm text-ink-3">Pas de photo</span>
              )}
            </div>
            <input ref={fileInput} type="file" accept="image/*" onChange={handlePhoto} className="sr-only" aria-label="Photo du chien" />
            <button type="button" onClick={() => fileInput.current?.click()} className="btn-quiet mt-4">
              <Camera aria-hidden className="size-4" />
              {preview ? "Changer la photo" : "Ajouter une photo"}
            </button>
          </div>

          <div className="lg:col-span-9">
            {error && <FormAlert>{error}</FormAlert>}
            <div className="grid gap-5 sm:grid-cols-2">
              {field("prenom", "Nom du chien", { required: true })}
              {field("race", "Race")}
              {field("date_de_naissance", "Date de naissance", { type: "date" }, form.date_de_naissance ? `${ageFrom(form.date_de_naissance)} an(s)` : undefined)}
              <div />
              {field("numero_de_puce", "Numéro de puce", { inputMode: "numeric", maxLength: 15 }, "15 caractères au plus.")}
              {field("numero_de_tatouage", "Numéro de tatouage", {}, "6 caractères au moins.")}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-rule pt-6">
              <button type="submit" disabled={saving} className="btn-line">
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
              <Link href="/creation-profil" className="btn-quiet">
                Annuler
              </Link>
              {dogId && (
                <div className="ml-auto flex items-center gap-3">
                  {confirmDelete ? (
                    <>
                      <span className="text-sm text-ink-2">Supprimer définitivement ?</span>
                      <button type="button" onClick={handleDelete} className="btn-danger">
                        Oui, supprimer
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(false)} className="btn-quiet">
                        Non
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setConfirmDelete(true)} className="text-sm font-semibold text-danger hover:underline">
                      Supprimer ce chien
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
