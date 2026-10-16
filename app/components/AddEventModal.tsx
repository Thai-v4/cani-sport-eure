"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient"; // Client Supabase
import "./AddEvent.css"; // Si tu as des styles additionnels

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddEventModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [isExternal, setIsExternal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const router = useRouter();

  // Bloque le scroll en arrière-plan quand la modal est ouverte
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        return;
      }
      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData?.user) {
        console.error("❌ Erreur récupération utilisateur :", error);
        return;
      }
      setUserId(userData.user.id);
      setIsLoading(false);
    };
    checkUser();
  }, []);

  if (!isOpen) return null;

  const createGoogleCalendarEvent = async (accessToken: string) => {
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    const visibility = isExternal ? "public" : "private"; // ← correspondance visuelle

    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title,
        start: startDateTime,
        end: endDateTime,
        // Exemple de concaténation pour le titre avec couleur et contenu
        color: `#3b82f6::${visibility}::${content}`,
        location: "",
        description: content,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Erreur ajout Google Calendar:", data);
      alert("L’événement a été créé mais pas ajouté dans Google Calendar.");
      return null;
    }
    return data.id; // ID de l'événement dans Google Calendar
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    let imageUrl = "";

    if (image) {
      const uniqueFileName = `${uuidv4()}-${image.name}`;
      const { data, error } = await supabase.storage
        .from("images")
        .upload(`evenements/${uniqueFileName}`, image);

      if (error) {
        console.error("Erreur upload image:", error.message);
        alert("Erreur lors du téléchargement de l'image.");
        return;
      }

      imageUrl = data?.path
        ? supabase.storage.from("images").getPublicUrl(data.path).data.publicUrl
        : "";
    }

    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;
    if (!accessToken) {
      alert("Impossible d'obtenir l'access token Google.");
      return;
    }

    const googleId = await createGoogleCalendarEvent(accessToken);

    const { error } = await supabase.from("evenements").insert([
      {
        titre: title,
        contenu: content,
        date,
        type: isExternal ? "Externe" : "Interne",
        image_url: imageUrl,
        id_profil: userId,
        id_google: googleId, // stocké ici
        heure_debut: startTime,
        heure_fin: endTime,
      },
    ]);

    if (error) {
      console.error("Erreur lors de la création de l'événement:", error);
      alert("Erreur lors de la création de l'événement.");
    } else {
      alert("Événement créé avec succès !");
      onClose();
      router.refresh();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setImage(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-[780px] h-auto max-h-[90vh] overflow-auto flex flex-col border border-rule">
        {/* En-tête */}
        <div className="flex justify-between items-center border-b border-gray-300 p-4">
          <h2 className="text-xl font-semibold">Ajouter un événement</h2>
          <button className="text-gray-600 hover:text-gray-800" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-4 grow flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex-1">
              <label className="block text-gray-700 mb-1">Titre</label>
              <input
                type="text"
                placeholder="Titre"
                className="w-full p-2 border border-gray-300 rounded-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 md:max-w-[250px]">
              <label className="block text-gray-700 mb-1">Date</label>
              <input
                type="date"
                className="w-full p-2 border border-gray-300 rounded-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-gray-700 mb-1">Heure de début</label>
              <input
                type="time"
                className="w-full p-2 border border-gray-300 rounded-sm"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 mb-1">Heure de fin</label>
              <input
                type="time"
                className="w-full p-2 border border-gray-300 rounded-sm"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Contenu</label>
            <textarea
              placeholder="Contenu"
              className="w-full p-2 border border-gray-300 rounded-sm h-32"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
          </div>

          <div className="flex items-center gap-2">
            <label className="block text-gray-700">Statut</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isExternal}
                onChange={() => setIsExternal(!isExternal)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
            <span className="text-gray-600">{isExternal ? "Externe" : "Interne"}</span>
          </div>

          <div className="flex items-center">
            <input
              type="file"
              className="hidden"
              id="imageUpload"
              onChange={handleImageChange}
              accept="image/*"
            />
            <label htmlFor="imageUpload" className="cursor-pointer bg-blue-700 text-white py-2 px-6 rounded-sm text-lg font-semibold hover:bg-blue-900 inline-block">
              {image ? "Modifier l'image" : "Ajouter une image"}
            </label>
            {image && <p className="ml-2 text-sm">{image.name}</p>}
          </div>

          {/* Bouton Submit */}
          <div className="flex justify-center mt-4">
            <button
              type="submit"
              className="bg-blue-700 text-white py-2 px-6 rounded-sm hover:bg-blue-800 transition w-full md:w-auto"
            >
              Créer un événement
            </button>
          </div>

          {message && <p className="text-center text-sm text-red-500 mt-2">{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default AddEventModal;
