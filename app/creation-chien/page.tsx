"use client"; // Indique que ce composant s'exécute côté client

import { useEffect, useState } from "react"; // Hooks React
import supabase from "@/lib/supabaseClient"; // Client Supabase
import { useRouter, useParams } from "next/navigation"; // Navigation et paramètres d'URL
import { v4 as uuidv4 } from "uuid"; // Générateur d'identifiants uniques
import Sidebar from "../components/sidebars/Sidebar"; // Barre latérale
import Footer from "../components/sidebars/Footer"; // Pied de page
import WhiteBackground from "../components/backgrounds/WhiteBackground"; // Fond blanc
import Image from "next/image"; // Composant d'image optimisé


export default function PetProfileForm() {
  const router = useRouter(); // Hook de navigation
  const { id } = useParams(); // Récupération de l'ID du chien depuis l'URL

  // État du formulaire avec valeurs par défaut
  const [form, setForm] = useState<{ [key: string]: string | number }>({
    prenom: "",
    age: 0,
    race: "",
    date_de_naissance: "",
    numero_de_puce: "",
    numero_de_tatouage: "",
    photo_chien: "",
  });

  const [image, setImage] = useState<File | null>(null); // Fichier image sélectionné
  const [photoPreview, setPhotoPreview] = useState<string | null>(null); // URL de prévisualisation
  const [userId, setUserId] = useState<string | null>(null); // ID de l'utilisateur connecté
  const [loading, setLoading] = useState(true); // État de chargement

  // Vérification de l'authentification utilisateur
  useEffect(() => {
    const checkUser = async () => {
      const { data: userSession } = await supabase.auth.getSession();
      if (!userSession.session) {
        router.replace("/connexion"); // Redirection si non connecté
        return;
      }
      setUserId(userSession.session.user.id);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  // Chargement des données du chien si on est en mode édition
  useEffect(() => {
    if (id && id !== "new") {
      fetchChienData();
    }
  }, [id]);

  // Récupération des données du chien depuis Supabase
  const fetchChienData = async () => {
    const { data, error } = await supabase
      .from("chiens")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erreur lors de la récupération du chien:", error.message);
    } else {
      // Mise à jour du formulaire avec les données existantes
      setForm({
        prenom: data.prenom ?? "",
        age: data.age ?? 0,
        race: data.race ?? "",
        date_de_naissance: data.date_de_naissance ?? "",
        numero_de_puce: data.numero_de_puce ?? "",
        numero_de_tatouage: data.numero_de_tatouage ?? "",
        photo_chien: data.photo_chien ?? "",
      });
      // Prévisualisation de la photo existante
      if (data.photo_chien) {
        setPhotoPreview(data.photo_chien);
      }
    }
  };

  // Gestion du changement d'image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner un fichier image valide.");
      return;
    }

    setImage(file);
    setPhotoPreview(URL.createObjectURL(file)); // Création d'URL pour prévisualisation
  };

  // Gestion des changements dans les champs du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prevForm) => {
      const updatedForm = {
        ...prevForm,
        [name]: value ?? "",
      };

      // Calcul automatique de l'âge à partir de la date de naissance
      if (name === "date_de_naissance") {
        const today = new Date();
        const birthDate = new Date(value);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        updatedForm.age = Math.max(age, 0);
      }

      return updatedForm;
    });
  };

  // Soumission du formulaire (création ou mise à jour)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vérification de l'authentification
    if (!userId) {
      alert("⚠️ Vous devez être connecté pour enregistrer un chien.");
      return;
    }

    // Détermination de l'ID (existant ou nouveau)
    const chienId = typeof id === "string" && id !== "new" ? id : uuidv4();

    // Validation des champs
    const numeroPuce = form.numero_de_puce as string;
    const numeroTatouage = form.numero_de_tatouage as string;

    if (numeroPuce.length > 15) {
      alert("⚠️ Le numéro de puce ne peut pas dépasser 15 caractères.");
      return;
    }

    if (numeroTatouage && numeroTatouage.length < 6) {
      alert("⚠️ Le numéro de tatouage doit contenir au moins 6 caractères.");
      return;
    }

    let imageUrl = form.photo_chien as string;

    // Upload de l'image si une nouvelle a été sélectionnée
    if (image) {
      // Nettoyage du nom de fichier pour éviter les problèmes
      const cleanFileName = image.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const uniqueFileName = `${uuidv4()}-${cleanFileName}`;

      // Téléchargement vers le bucket Supabase
      const { data, error } = await supabase.storage
        .from("images")
        .upload(`chiens/${uniqueFileName}`, image);

      if (error) {
        console.error(
          "❌ Erreur lors du téléchargement de l'image:",
          error.message
        );
        alert("Erreur lors du téléchargement de l'image.");
        return;
      }

      // Récupération de l'URL publique
      imageUrl = supabase.storage.from("images").getPublicUrl(data.path)
        .data.publicUrl;
    }

    // Insertion ou mise à jour dans la base de données
    const { error } = await supabase.from("chiens").upsert([
      {
        id: chienId,
        ...form,
        photo_chien: imageUrl,
        id_profil: userId,
      },
    ]);

    if (error) {
      console.error("❌ Erreur lors de l'enregistrement :", error.message);
      alert("Erreur lors de l'enregistrement.");
    } else {
      alert("Le profil du chien a été enregistré avec succès !");
      router.push("/creation-profil"); // Redirection vers la page profil
    }
  };

  // Suppression du profil de chien
  const handleDelete = async () => {
    const confirmDelete = confirm(
      "❗ Êtes-vous sûr de vouloir supprimer ce chien ?"
    );
    if (!confirmDelete) return;

    // Suppression dans la base de données
    const { error } = await supabase.from("chiens").delete().eq("id", id);

    if (error) {
      console.error("❌ Erreur lors de la suppression :", error.message);
      alert("Erreur lors de la suppression.");
    } else {
      alert("🐾 Chien supprimé avec succès !");
      router.push("/creation-profil"); // Redirection vers la page profil
    }
  };

  return (
    <div>
      <Sidebar /> {/* Barre latérale de navigation */}
      <WhiteBackground>
        {" "}
        {/* Fond blanc pour le contenu */}
        {/* Titre en haut à gauche */}
        <div className="relative px-4 sm:px-6 pt-28 pb-12 flex justify-center">
          <h1 className="absolute top-6 left-6 text-3xl sm:text-4xl font-bold text-black">
            Créer un profil chien
          </h1>

          {/* Formulaire */}
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-(--breakpoint-sm) bg-[#475C99] text-black p-6 sm:p-8 rounded-2xl shadow-2xl border-4 border-black space-y-5"
          >
            {/* Zone d'upload/prévisualisation de l'image */}
            <div className="flex flex-col items-center">
              <label htmlFor="photo-upload" className="cursor-pointer mb-2">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Photo du chien"
                    className="w-32 h-32 object-cover rounded-full shadow-md"
                    onError={(e) => {
                      e.currentTarget.src = ""; // Fallback to empty if the URL is invalid
                      alert("Erreur lors du chargement de l'image.");
                    }}
                    width={200}
                    height={200}
                  />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center text-center text-sm font-medium bg-gray-300 rounded-full text-black">
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
            <div className="space-y-4">
              {[
                { name: "prenom", label: "Prénom" },
                { name: "race", label: "Race" },
                {
                  name: "date_de_naissance",
                  label: "Date de naissance",
                  type: "date",
                  max: new Date().toISOString().split("T")[0], // Date max = aujourd'hui
                },
                {
                  name: "numero_de_puce",
                  label: "Numéro de puce",
                  maxLength: 15,
                },
                {
                  name: "numero_de_tatouage",
                  label: "Numéro de tatouage",
                  maxLength: 6,
                },
                { name: "age", label: "Âge", type: "number", readOnly: true }, // Champ calculé automatiquement
              ].map(({ name, label, ...rest }) => (
                <div key={name} className="flex flex-col">
                  <label className="text-white text-sm mb-1">{label}</label>
                  <input
                    name={name}
                    value={form[name] as string | number}
                    onChange={handleChange}
                    className={`p-2 rounded-md ${rest.readOnly ? "bg-gray-300 text-black cursor-not-allowed" : "text-black"}`}
                    {...rest}
                  />
                </div>
              ))}
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-center items-center pt-6 space-x-6">
              <button
                type="submit"
                className="bg-white text-black rounded-full px-6 py-2 text-[15px] font-semibold shadow-md hover:bg-gray-200"
              >
                Enregistrer les modifications
              </button>
              {/* Bouton de suppression (uniquement en mode édition) */}
              {id !== "new" && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-white text-3xl hover:text-red-500 transition"
                  title="Supprimer le chien"
                >
                  🗑
                </button>
              )}
            </div>
          </form>
        </div>
      </WhiteBackground>
      <Footer /> {/* Pied de page */}
    </div>
  );
}
