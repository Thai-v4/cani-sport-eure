"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import supabase from "@/lib/supabaseClient";
import "./AddEvent.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: string;
}

const EditEventModal: React.FC<ModalProps> = ({ isOpen, onClose, articleId }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [isInternal, setIsInternal] = useState<boolean>(false);
  const [idGoogle, setIdGoogle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchArticle = async () => {
      const { data, error } = await supabase
        .from("evenements")
        .select("titre, contenu, image_url, date, type, id_google, heure_debut, heure_fin")
        .eq("id", articleId)
        .single();

      if (error) {
        console.error("Erreur récupération événement :", error);
      } else {
        setTitle(data.titre);
        setContent(data.contenu);
        setDate(data.date?.split("T")[0] || "");
        setStartTime(data.heure_debut || "10:00");
        setEndTime(data.heure_fin || "11:00");
        setIsInternal(data.type === "interne");
        setIdGoogle(data.id_google || null);
      }
    };

    if (articleId) fetchArticle();
  }, [articleId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
  };

  const updateGoogleCalendar = async () => {
    if (!idGoogle) return;

    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;

    if (!accessToken) {
      alert("Impossible d'obtenir l'access token Google.");
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    const visibility = isInternal ? "private" : "public";
const fullColor = `#3b82f6::${visibility}::${content}`

    const res = await fetch("/api/calendar", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        id: idGoogle,
        title,
        description: content,
        start: startDateTime,
        color: fullColor,
        location: "",
        end: endDateTime,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("Erreur Google Calendar :", error);
      alert("Mise à jour dans Google Calendar échouée.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl = "";

    if (image) {
      const uniqueFileName = `${uuidv4()}-${image.name}`;
      const { data, error } = await supabase.storage
        .from("images")
        .upload(`event/${uniqueFileName}`, image);

      if (error) {
        console.error("Erreur image :", error);
        alert("Échec du téléchargement d'image.");
        setLoading(false);
        return;
      }

      imageUrl = supabase.storage.from("images").getPublicUrl(data.path).data.publicUrl;
    }

    const { error } = await supabase
      .from("evenements")
      .update({
        titre: title,
        contenu: content,
        date,
        type: isInternal ? "interne" : "externe",
        image_url: imageUrl || undefined,
        heure_debut: startTime,
        heure_fin: endTime,
      })
      .eq("id", articleId);

    if (error) {
      console.error("Erreur Supabase :", error);
      alert("Erreur lors de la mise à jour.");
    } else {
      await updateGoogleCalendar();
      alert("Événement mis à jour !");
      onClose();
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-[780px] h-auto max-h-[90vh] overflow-auto flex flex-col border border-rule">
        {/* En-tête */}
        <div className="flex justify-between items-center border-b border-gray-300 p-4">
          <h2 className="text-xl font-semibold">Modifier un événement</h2>
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
              className="w-full p-2 border border-gray-300 rounded-sm h-32"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="block text-gray-700">Statut</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={() => setIsInternal(!isInternal)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
            <span className="text-gray-600">{isInternal ? "Interne" : "Externe"}</span>
          </div>

          <div className="flex items-center">
            <input
              type="file"
              className="hidden"
              id="imageEditUpload"
              onChange={handleImageChange}
              accept="image/*"
            />
            <label htmlFor="imageEditUpload" className="cursor-pointer bg-blue-700 text-white py-2 px-6 rounded-sm text-lg font-semibold hover:bg-blue-900 inline-block">
              {image ? "Modifier l'image" : "Changer l'image"}
            </label>
            {image && <p className="ml-2 text-sm">{image.name}</p>}
          </div>

          {/* Bouton Submit */}
          <div className="flex justify-center mt-4">
            <button
              type="submit"
              className="bg-blue-700 text-white py-2 px-6 rounded-sm hover:bg-blue-800 transition w-full md:w-auto"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>

          {message && <p className="text-center text-sm text-red-500 mt-2">{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default EditEventModal;
