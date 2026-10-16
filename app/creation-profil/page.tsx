"use client"; // Indique que ce composant s'exécute côté client

import React, { useState, useEffect, useCallback } from "react"; // Imports React et hooks
import supabase from "@/lib/supabaseClient"; // Client Supabase
import { v4 as uuidv4 } from "uuid"; // Générateur d'identifiants uniques
import { useRouter } from "next/navigation"; // Navigation entre pages
import Sidebar from "../components/sidebars/Sidebar"; // Barre latérale
import Footer from "../components/sidebars/Footer"; // Pied de page
import { useAuth } from "@/app/components/Auth/AuthProvider"; // Contexte d'authentification
import WhiteBackground from "../components/backgrounds/WhiteBackground"; // Fond blanc
import Image from "next/image"; // Composant d'image optimisé Next.js

export default function UserProfileForm() {
  const router = useRouter(); // Hook de navigation
  const { role, isLoading } = useAuth(); // Récupération du rôle utilisateur

  // État du formulaire avec valeurs par défaut
  const [form, setForm] = useState({
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
  });

  // États pour la gestion de l'image de profil
  const [image, setImage] = useState<File | null>(null); // Fichier image sélectionné
  const [photoPreview, setPhotoPreview] = useState<string | null>(null); // URL de prévisualisation
  const [loading, setLoading] = useState(false); // État de chargement
  const [isMounted, setIsMounted] = useState(false); // Vérification du montage du composant
  const [chiens, setChiens] = useState<{ id: string; prenom: string }[]>([]); // Liste des chiens de l'utilisateur

  // Protection de la route - redirection si non authentifié
  useEffect(() => {
    if (!isLoading && role !== "admin" && role !== "adherent") {
      router.push("/connexion");
    }
  }, [role, isLoading, router]);

  // Marquage du composant comme monté
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Récupération des données du profil et des chiens
  useEffect(() => {
    if (!isMounted) return;

    const fetchUserProfile = async () => {
      // Récupération de la session utilisateur
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) return console.error("Erreur session:", error.message);

      if (session) {
        const profileId = session.user.id;

        // Récupération des données du profil
        const { data: profileData, error: profileError } = await supabase
          .from("profils")
          .select("*")
          .eq("id", profileId)
          .single();

        if (profileError) {
          console.error("Erreur profil:", profileError.message);
        } else {
          // Mise à jour du formulaire avec les données du profil
          setForm((prev) => ({ ...prev, ...profileData }));
          if (profileData.photo_profil)
            setPhotoPreview(profileData.photo_profil);

          // Récupération des chiens liés à l'utilisateur
          const { data: chiensData, error: chiensError } = await supabase
            .from("chiens")
            .select("id, prenom")
            .eq("id_profil", profileId);

          if (chiensError) {
            console.error("Erreur chiens:", chiensError.message);
          } else {
            setChiens(chiensData ?? []);
          }
        }
      }
    };

    fetchUserProfile();
  }, [isMounted]);

  // Gestion du changement de fichier image
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        alert("Veuillez sélectionner un fichier image.");
        return;
      }

      setImage(file);
      setPhotoPreview(URL.createObjectURL(file)); // Création d'URL pour prévisualisation
    },
    []
  );

  // Gestion des changements dans les champs du formulaire
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Gestion spécifique pour le code postal avec auto-complétion de la ville
  const handleChangeCodePostal = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, code_postal: value }));

    // Auto-complétion de la ville si le code postal est complet
    if (value.length === 5) {
      try {
        const res = await fetch(`https://api.zippopotam.us/fr/${value}`);
        if (!res.ok) throw new Error("Code postal non trouvé");
        const data = await res.json();
        const city = data.places?.[0]?.["place name"];
        if (city) setForm((prev) => ({ ...prev, ville: city }));
      } catch (err) {
        console.error("Erreur ville:", err);
      }
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl = form.photo_profil;

    // Upload de l'image si une nouvelle a été sélectionnée
    if (image) {
      const sanitized = image.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const fileName = `${uuidv4()}-${sanitized}`; // Nom unique pour éviter les conflits

      const { data, error } = await supabase.storage
        .from("images")
        .upload(`profils/${fileName}`, image);
      if (error) {
        alert("Erreur image.");
        setLoading(false);
        return;
      }

      imageUrl = supabase.storage.from("images").getPublicUrl(data.path)
        .data.publicUrl;
    }

    // Mise à jour du profil dans la base de données
    const { error } = await supabase
      .from("profils")
      .upsert([{ ...form, photo_profil: imageUrl, id: form.id }]);
    if (error) {
      alert("Erreur enregistrement.");
    } else {
      alert("Profil enregistré !");
    }

    setLoading(false);
  };

  // Calcul de l'âge à partir de la date de naissance
  const getAge = (dateString: string): number => {
    if (!dateString) return 0;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const age = getAge(form.date_de_naissance); // Calcul de l'âge pour adapter les options de licence

  // Ne rien rendre avant que le composant soit monté
  if (!isMounted) return null;

  return (
    <div>
      <Sidebar /> {/* Barre latérale de navigation */}
      <WhiteBackground>
        {" "}
        {/* Fond blanc pour le contenu */}
        {/* Titre fixe en haut à gauche */}
        <div className="relative">
          <h1 className="absolute top-6 left-6 text-3xl sm:text-4xl primary_title text-black!">
            Profil utilisateur
          </h1>
        </div>
        {/* Contenu central du formulaire */}
        <div className="flex justify-center px-4 sm:px-6 pt-28 pb-12">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-(--breakpoint-sm) bg-[#475C99] p-6 sm:p-8 rounded-xl shadow-lg border-4 border-black space-y-4 text-black"
          >
            {/* Sélection/prévisualisation de l'image de profil */}
            <div className="flex flex-col items-center">
              <label htmlFor="photo-upload" className="cursor-pointer mb-2">
                {photoPreview ? (
                  <Image
                    width={128}
                    height={128}
                    src={photoPreview}
                    alt="Photo de profil"
                    className="w-32 h-32 object-cover rounded-full shadow-md"
                  />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center bg-gray-300 rounded-full text-black text-center text-sm font-medium">
                    Ajouter une photo
                  </div>
                )}
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Champs du formulaire générés dynamiquement */}
            {[
              { name: "nom", label: "Nom" },
              { name: "prenom", label: "Prénom" },
              { name: "telephone", label: "Téléphone" },
              { name: "adresse", label: "Adresse" },
              {
                name: "code_postal",
                label: "Code postal",
                handler: handleChangeCodePostal,
              },
              { name: "ville", label: "Ville" },
              {
                name: "date_de_naissance",
                label: "Date de naissance",
                type: "date",
              },
            ].map(({ name, label, type = "text", handler }) => (
              <div key={name} className="flex flex-col">
                <label className="text-white text-sm mb-1">{label}</label>
                <input
                  type={type}
                  name={name}
                  value={form[name as keyof typeof form]}
                  onChange={handler ?? handleChange}
                  className="p-2 rounded-md text-black"
                />
              </div>
            ))}

            {/* Sélection de licence (adaptée à l'âge) */}
            <div className="flex flex-col">
              <label className="text-white text-sm mb-1">Licence</label>
              <select
                name="licence"
                value={form.licence}
                onChange={handleChange}
                className="p-2 rounded-md text-black"
              >
                <option value="">-- Sélectionner une licence --</option>
                {age >= 17 ? (
                  <>
                    <option value="loisir_adulte">Licence loisir adulte</option>
                    <option value="loisir_adulte_handisport">
                      Licence loisir adulte handisport
                    </option>
                    <option value="competition_adulte">
                      Licence compétition adulte
                    </option>
                    <option value="competition_adulte_handisport">
                      Licence compétition adulte handisport
                    </option>
                  </>
                ) : (
                  <option value="Licence enfant">Licence enfant</option>
                )}
              </select>
            </div>

            {/* Email (en lecture seule) */}
            <div className="flex flex-col">
              <label className="text-white text-sm mb-1">Email</label>
              <input
                value={form.email}
                disabled
                className="p-2 bg-gray-300 text-gray-500 rounded-md"
              />
            </div>

            {/* Liste des chiens avec bouton pour en ajouter */}
            <div className="pt-4 flex flex-wrap gap-2">
              {chiens.map((chien) => (
                <button
                  key={chien.id}
                  onClick={() => router.push(`/creation-chien/${chien.id}`)}
                  type="button"
                  className="bg-white px-3 py-1 rounded-full text-black shadow-md hover:bg-gray-300"
                >
                  {chien.prenom}
                </button>
              ))}
              <button
                type="button"
                onClick={() => router.push("/creation-chien")}
                className="bg-white px-3 py-1 rounded-full text-black shadow-md"
              >
                +
              </button>
            </div>

            {/* Bouton d'enregistrement */}
            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={loading}
                className="bg-white text-black px-6 py-2 rounded-full font-semibold shadow-md hover:bg-gray-200"
              >
                {loading
                  ? "Enregistrement..."
                  : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </div>
      </WhiteBackground>
      <Footer /> {/* Pied de page */}
    </div>
  );
}
