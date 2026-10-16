"use client";

import { useEffect, useState, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import supabase from "@/lib/supabaseClient"; // Client Supabase (session partagée)


interface ModalAddProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (resultat: any) => void;
}

const ModalAdd = ({ isOpen, onClose, onAdd }: ModalAddProps) => {
  const [date, setDate] = useState("");
  const [temps, setTemps] = useState("");
  const [vitesse, setVitesse] = useState("");
  const [distance, setDistance] = useState("");
  const [region, setRegion] = useState("");
  const [lieu, setLieu] = useState("");
  const [nomActivite, setNomActivite] = useState("");
  const [kmAR, setKmAR] = useState("");
  const [classement, setClassement] = useState("");
  const [id_chien, setIdChien] = useState("");
  const [id_profil, setIdProfil] = useState("");
  const [id_categorie, setIdCategorie] = useState("");
  const [id_type, setIdType] = useState("");

  const [chiens, setChiens] = useState<any[]>([]);
  const [filteredChiens, setFilteredChiens] = useState<any[]>([]);
  const [profils, setProfils] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: chiensData } = await supabase.from("chiens").select("*");
      const { data: profilsData } = await supabase.from("profils").select("*");
      const { data: catData } = await supabase
        .from("categorieResultat")
        .select("*");
      const { data: typeData } = await supabase
        .from("resultatType")
        .select("*");

      if (chiensData) setChiens(chiensData);
      if (profilsData) setProfils(profilsData);
      if (catData) setCategories(catData);
      if (typeData) setTypes(typeData);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (id_profil) {
      const relatedChiens = chiens.filter(
        (chien) => chien.id_profil === id_profil
      );
      setFilteredChiens(relatedChiens);
      setIdChien("");
    } else {
      setFilteredChiens([]);
      setIdChien("");
    }
  }, [id_profil, chiens]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const resetForm = () => {
    setDate("");
    setTemps("");
    setVitesse("");
    setDistance("");
    setRegion("");
    setLieu("");
    setNomActivite("");
    setKmAR("");
    setClassement("");
    setIdChien("");
    setIdProfil("");
    setIdCategorie("");
    setIdType("");
  };

  const handleAddResult = async () => {
    if (
      !date ||
      !temps ||
      !vitesse ||
      !distance ||
      !region ||
      !lieu ||
      !nomActivite ||
      !id_chien ||
      !id_profil ||
      !id_categorie ||
      !id_type
    ) {
      setMessage("❌ Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    setMessage("");

    const insertResponse = await supabase
      .from("resultats")
      .insert([
        {
          date,
          temps,
          vitesse,
          distance,
          region,
          lieu,
          nomActivite,
          kmAR,
          classement,
          id_chien,
          id_profil,
          id_categorie,
          id_type,
        },
      ])
      .select("id")
      .single();

    if (insertResponse.error) {
      console.error("❌ Erreur d'insertion :", insertResponse.error);
      setMessage("❌ Une erreur est survenue.");
      setLoading(false);
      return;
    }

    const { data: fullData, error: refetchError } = await supabase
      .from("resultats")
      .select(
        `
        *,
        chiens ( prenom ),
        profils ( nom, prenom ),
        categorieResultat ( nom_categorie ),
        resultatType ( nom_resultat )
      `
      )
      .eq("id", insertResponse.data.id)
      .single();

    if (refetchError) {
      console.error("❌ Erreur de récupération :", refetchError);
      setMessage("❌ Résultat créé, mais erreur lors du rechargement.");
    } else {
      onAdd(fullData);
      setMessage("✅ Résultat ajouté !");
      resetForm();
      timeoutRef.current = setTimeout(() => onClose(), 2000);
    }

    setLoading(false);
  };

  const regions = [
    "Auvergne-Rhône-Alpes",
    "Bourgogne-Franche-Comté",
    "Bretagne",
    "Centre-Val de Loire",
    "Corse",
    "Grand Est",
    "Hauts-de-France",
    "Île-de-France",
    "Normandie",
    "Nouvelle-Aquitaine",
    "Occitanie",
    "Pays de la Loire",
    "Provence-Alpes-Côte d'Azur",
    "Guadeloupe",
    "Guyane",
    "Martinique",
    "Mayotte",
    "La Réunion",
  ];

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="p-4 sm:p-8 w-full h-full flex items-center justify-center">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-full overflow-y-auto relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
          >
            <FaTimes />
          </button>

          <h2 className="text-2xl font-bold mb-4 text-center">
            Ajouter un Résultat
          </h2>
          <hr className="mb-6 border-gray-300" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              value={id_profil}
              onChange={(e) => setIdProfil(e.target.value)}
              className="p-3 border border-gray-300 rounded-sm"
            >
              <option value="">-- Sélectionner un participant --</option>
              {profils.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} {p.prenom}
                </option>
              ))}
            </select>

            <select
              value={id_chien}
              onChange={(e) => setIdChien(e.target.value)}
              className="p-3 border border-gray-300 rounded-sm"
            >
              <option value="">-- Sélectionner un chien --</option>
              {filteredChiens.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.prenom}
                </option>
              ))}
            </select>

            <select
              value={id_categorie}
              onChange={(e) => setIdCategorie(e.target.value)}
              className="p-3 border border-gray-300 rounded-sm"
            >
              <option value="">-- Sélectionner une catégorie --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nom_categorie}
                </option>
              ))}
            </select>

            <select
              value={id_type}
              onChange={(e) => setIdType(e.target.value)}
              className="p-3 border border-gray-300 rounded-sm"
            >
              <option value="">-- Sélectionner un type --</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nom_resultat}
                </option>
              ))}
            </select>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Date compétition / événements
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="p-3 border border-gray-300 rounded-sm w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Temps de parcours du participant
              </label>
              <input
                type="time"
                step="1"
                value={temps}
                onChange={(e) => setTemps(e.target.value)}
                className="p-3 border border-gray-300 rounded-sm w-full"
                placeholder="Temps"
              />
            </div>

            <input
              type="text"
              value={vitesse}
              onChange={(e) => setVitesse(e.target.value)}
              className="p-3 border border-gray-300 rounded-sm"
              placeholder="Vitesse"
            />
            <input
              type="text"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="p-3 border border-gray-300 rounded-sm"
              placeholder="Distance"
            />
            <div>
              <label className="block text-sm text-gray-700 mb-1">Région</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="p-3 border border-gray-300 rounded-sm w-full"
              >
                <option value="">-- Sélectionner une région --</option>
                {regions.map((regionName) => (
                  <option key={regionName} value={regionName}>
                    {regionName}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              className="p-3 border border-gray-300 rounded-sm"
              placeholder="Lieu"
            />
            <input
              type="text"
              value={nomActivite}
              onChange={(e) => setNomActivite(e.target.value)}
              className="p-3 border border-gray-300 rounded-sm"
              placeholder="Nom Activité"
            />
            <input
              type="text"
              value={kmAR}
              onChange={(e) => setKmAR(e.target.value)}
              className="p-3 border border-gray-300 rounded-sm"
              placeholder="km Aller-Retour"
            />
            <input
              type="text"
              value={classement}
              onChange={(e) => setClassement(e.target.value)}
              className="p-3 border border-gray-300 rounded-sm"
              placeholder="Classement"
            />
          </div>

          <div className="text-center mt-6">
            <button
              onClick={handleAddResult}
              disabled={loading}
              className="bg-blue-700 text-white py-3 px-8 rounded-full text-lg font-semibold hover:bg-blue-900"
            >
              {loading ? "Ajout en cours..." : "Ajouter le résultat"}
            </button>
          </div>

          {message && (
            <p className="text-center text-sm mt-4 text-red-500">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalAdd;
