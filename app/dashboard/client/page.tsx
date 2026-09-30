"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient"; // Client Supabase
import { useAuth } from "@/app/components/Auth/AuthProvider";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FaTrophy,
  FaRoute,
  FaCalendarAlt,
  FaDog,
  FaRunning,
  FaStar,
  FaMapMarkerAlt,
} from "react-icons/fa";

// Composants d'interface
import Sidebar from "@/app/components/sidebars/Sidebar";
import Footer from "@/app/components/sidebars/Footer";

// Bibliothèque de graphiques (à installer)
import { Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
ChartJS.register(...registerables);

const ClientDashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, role, isLoading } = useAuth();

  // États
  const [userId, setUserId] = useState<string | null>(null);
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [eventStats, setEventStats] = useState({
    participants: 0,
    kmParcourus: 0,
    kmMax: 0,
  });
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [eventMap, setEventMap] = useState<Record<string, number>>({});
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [activityNames, setActivityNames] = useState<string[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [dogs, setDogs] = useState<any[]>([]);
  const [selectedDogIndex, setSelectedDogIndex] = useState(0);
  const [mobileView, setMobileView] = useState<boolean>(false); // Pour les résultats en vue mobile
  const [isTableExpanded, setIsTableExpanded] = useState<boolean>(false);
  const [dashboardLoaded, setDashboardLoaded] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Protection de la route
  useEffect(() => {
    if (!isLoading && (!user || (role !== "adherent" && role !== "admin"))) {
      router.replace("/connexion");
    }
  }, [isLoading, user, role]);

  // Détection du mobile
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
    };

    handleResize(); // Initialisation
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Chargement initial des données
  useEffect(() => {
    const fetchData = async () => {
      const uid = user?.id;
      if (!uid) return;

      setUserId(uid);

      try {
        // Récupération des activités uniques
        const { data: allResults } = await supabase
          .from("resultats")
          .select("nomActivite")
          .eq("id_profil", uid);

        if (allResults) {
          const uniqueActivities = [
            ...new Set(
              allResults.map((res: any) => res.nomActivite).filter(Boolean)
            ),
          ];
          setActivityNames(uniqueActivities);
          if (uniqueActivities.length > 0)
            setSelectedActivity(uniqueActivities[0]);
        }

        // Récupération des résultats sportifs
        const { data: results } = await supabase
          .from("resultats")
          .select("nomActivite, lieu, distance, classement, date, id_type")
          .eq("id_profil", uid)
          .order("date", { ascending: false });

        if (results) setResultsData(results);

        // Récupération des participations aux événements
        const { data: participations } = await supabase
          .from("participation")
          .select("id_evenement")
          .eq("id_profil", uid);

        const eventIds = participations?.map((p: any) => p.id_evenement) || [];

        // Récupération des détails des événements
        const { data: events } = await supabase
          .from("evenements")
          .select("id, titre")
          .in("id", eventIds);

        const names = events?.map((e: any) => e.titre) || [];
        const map: Record<string, number> = {};
        events?.forEach((e: any) => (map[e.titre] = e.id));

        setEventNames(names);
        setEventMap(map);

        if (names.length > 0) setSelectedEvent(names[0]);

        // Récupération des données des chiens (tous les chiens de l'utilisateur)
        const { data: chiens } = await supabase
          .from("chiens")
          .select("*")
          .eq("id_profil", uid)
          .order("prenom");

        setDogs(chiens || []);

        // Marquer le tableau de bord comme chargé
        setDashboardLoaded(true);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };

    if (!isLoading && user) fetchData();
  }, [isLoading, user]);

  // Chargement des statistiques pour l'événement sélectionné
  useEffect(() => {
    const fetchStatsForEvent = async () => {
      if (!userId || !selectedEvent || !eventMap[selectedEvent]) return;

      const eventId = eventMap[selectedEvent];

      // Récupération du nombre de participants
      const { data: participants } = await supabase
        .from("participation")
        .select("id")
        .eq("id_evenement", eventId);

      // Récupération des distances parcourues
      const { data: distances } = await supabase
        .from("resultats")
        .select("distance")
        .eq("id_profil", userId)
        .eq("id_evenement", eventId);

      const kmParcourus =
        distances?.reduce(
          (sum: number, res: any) => sum + parseFloat(res.distance || 0),
          0
        ) || 0;
      const kmMax = (participants?.length || 0) * 15; // Calcul de l'objectif

      setEventStats({
        participants: participants?.length || 0,
        kmParcourus,
        kmMax,
      });
    };

    fetchStatsForEvent();
  }, [selectedEvent, userId, supabase, eventMap]);

  // Écran de chargement
  if (isLoading || !user || (role !== "adherent" && role !== "admin")) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  // Calculs pour les statistiques
  const pourcentage =
    eventStats.kmMax > 0
      ? Math.round((eventStats.kmParcourus / eventStats.kmMax) * 100)
      : 0;
  const totalKm = resultsData.reduce(
    (sum, r) => sum + parseFloat(r.distance || 0),
    0
  );
  const bestRank = resultsData.reduce(
    (min, r) => Math.min(min, parseInt(r.classement || "999")),
    999
  );
  const podiums = resultsData.filter(
    (r) => parseInt(r.classement || "999") <= 3
  ).length;
  const lastResult = [...resultsData].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  // Préparation des données pour le graphique d'activité
  const activityData = {
    labels: resultsData
      .filter((r) => r.nomActivite === selectedActivity)
      .map((r) => new Date(r.date).toLocaleDateString())
      .slice(0, 10), // Limiter à 10 dates pour la lisibilité
    datasets: [
      {
        label: "Distance parcourue (km)",
        data: resultsData
          .filter((r) => r.nomActivite === selectedActivity)
          .map((r) => parseFloat(r.distance || 0))
          .slice(0, 10),
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  // Fonction pour formater le classement
  const formatClassement = (classement: string | number) => {
    if (!classement || classement === "999") return "N/A";

    // Ajouter le suffixe selon la position
    const num = parseInt(classement.toString());
    if (num === 1) return "1er";
    return `${num}ème`;
  };

  // Animation des éléments avec Framer Motion
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate={dashboardLoaded ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {/* En-tête avec nom de l'utilisateur */}
          <motion.div variants={fadeIn} className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Tableau de bord
            </h1>
            <p className="text-gray-600">
              Bienvenue, {user?.user_metadata?.first_name || "Athlète"}. Voici
              vos statistiques personnelles.
            </p>
          </motion.div>

          {/* Cartes de statistiques principales */}
          <motion.div
            variants={fadeIn}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {/* Carte de résumé */}
            <div className="col-span-1 md:col-span-3 bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Résumé de votre activité
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <FaRoute className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Distance totale</p>
                        <p className="font-semibold text-lg">
                          {totalKm.toFixed(1)} km
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <FaTrophy className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Podiums</p>
                        <p className="font-semibold text-lg">{podiums}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <FaStar className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Meilleur classement
                        </p>
                        <p className="font-semibold text-lg">
                          {bestRank === 999
                            ? "N/A"
                            : formatClassement(bestRank)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info sur la dernière compétition */}
                {lastResult && (
                  <div className="shrink-0 bg-blue-50 px-4 py-3 rounded-lg border-l-4 border-blue-500">
                    <h3 className="text-sm font-medium text-blue-800 flex items-center gap-1">
                      <FaCalendarAlt /> Dernière compétition
                    </h3>
                    <p className="mt-1 text-sm">
                      <span className="font-medium">
                        {lastResult.nomActivite}
                      </span>{" "}
                      à {lastResult.lieu}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-sm">
                      <span>{lastResult.distance} km</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                        {formatClassement(lastResult.classement)}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {new Date(lastResult.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Section principale (résultats et stats) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne gauche - Tableau des résultats récents & infos chien */}
            <motion.div variants={fadeIn} className="lg:col-span-2 space-y-6">
              {/* Carte des chiens */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <h2 className="flex items-center justify-between gap-2 text-lg font-semibold text-gray-900 mb-5">
                    <div className="flex items-center gap-2">
                      <FaDog className="text-blue-500" />
                      Mes compagnons de course
                    </div>
                    <button
                      onClick={() => router.push("/creation-chien")}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Ajouter
                    </button>
                  </h2>

                  {dogs.length > 0 ? (
                    <div>
                      {/* Navigation entre les chiens si plus d'un */}
                      {dogs.length > 1 && (
                        <div className="flex justify-center mb-4">
                          <div className="flex gap-1">
                            {dogs.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedDogIndex(idx)}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${
                                  idx === selectedDogIndex
                                    ? "bg-blue-600 scale-125"
                                    : "bg-gray-300 hover:bg-gray-400"
                                }`}
                                aria-label={`Voir chien ${idx + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Affichage du chien sélectionné */}
                      <div className="flex flex-col sm:flex-row items-start gap-6">
                        {/* Photo du chien */}
                        <div className="w-full sm:w-1/3 h-48 sm:h-48 lg:h-60 bg-linear-to-br from-blue-50 to-indigo-100 rounded-lg overflow-hidden relative">
                          {dogs[selectedDogIndex]?.photo_chien ? (
                            <div className="relative w-full h-full">
                              {!imageLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                  <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}
                              <Image
                                src={dogs[selectedDogIndex].photo_chien}
                                alt={`Photo de ${dogs[selectedDogIndex].prenom}`}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className={`object-cover transition-opacity duration-300 ${
                                  imageLoaded ? "opacity-100" : "opacity-0"
                                }`}
                                onLoad={() => setImageLoaded(true)}
                                onLoadingComplete={() => setImageLoaded(true)}
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "/images/default-dog-avatar.png";
                                  setImageLoaded(true);
                                }}
                              />
                            </div>
                          ) : (
                            // Affichage par défaut quand aucune photo n'est disponible
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-24 h-24 rounded-full bg-white shadow-inner flex items-center justify-center">
                                <FaDog className="text-4xl text-blue-300" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Informations du chien */}
                        <div className="w-full sm:w-2/3">
                          <div className="flex flex-col space-y-3">
                            <div className="flex items-center">
                              <span className="w-24 text-sm text-gray-500">
                                Nom
                              </span>
                              <span className="font-medium">
                                {dogs[selectedDogIndex].prenom}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="w-24 text-sm text-gray-500">
                                Race
                              </span>
                              <span>{dogs[selectedDogIndex].race}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="w-24 text-sm text-gray-500">
                                Âge
                              </span>
                              <span>{dogs[selectedDogIndex].age} ans</span>
                            </div>

                            {/* Boutons de navigation entre chiens */}
                            {dogs.length > 1 && (
                              <div className="flex items-center justify-between mt-2">
                                <button
                                  onClick={() =>
                                    setSelectedDogIndex((prev) =>
                                      prev === 0 ? dogs.length - 1 : prev - 1
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                                  aria-label="Chien précédent"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 19l-7-7 7-7"
                                    />
                                  </svg>
                                </button>
                                <span className="text-sm text-gray-500">
                                  {selectedDogIndex + 1} / {dogs.length}
                                </span>
                                <button
                                  onClick={() =>
                                    setSelectedDogIndex((prev) =>
                                      prev === dogs.length - 1 ? 0 : prev + 1
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                                  aria-label="Chien suivant"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </button>
                              </div>
                            )}

                            {/* Bouton pour modifier */}
                            <a
                              href={`/creation-chien/${dogs[selectedDogIndex].id}`}
                              className="mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 self-start"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                              Modifier les informations
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 px-6">
                      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaDog className="text-3xl text-blue-300" />
                      </div>
                      <p className="text-gray-500 mb-4">
                        Vous n&apos;avez pas encore enregistré votre chien
                      </p>
                      <Link
                        href="/creation-chien"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm inline-flex items-center gap-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Ajouter mon chien
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Tableau des résultats récents */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FaRunning className="text-blue-500" /> Mes résultats
                      récents
                    </h2>

                    {mobileView && (
                      <button
                        onClick={() => setIsTableExpanded(!isTableExpanded)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {isTableExpanded ? "Voir moins" : "Voir plus"}
                      </button>
                    )}
                  </div>

                  {/* Tableau version desktop */}
                  {!mobileView && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Compétition
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Lieu
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Distance
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Classement
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {resultsData.slice(0, 5).map((res, index) => (
                            <tr
                              key={index}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="font-medium text-gray-900">
                                  {res.nomActivite}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-700 flex items-center gap-1">
                                  <FaMapMarkerAlt
                                    className="text-gray-400"
                                    size={12}
                                  />
                                  {res.lieu}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                {res.distance} km
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {parseInt(res.classement || "0") <= 3 ? (
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      res.classement === "1"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : res.classement === "2"
                                          ? "bg-gray-100 text-gray-800"
                                          : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {res.classement === "1" && (
                                      <FaTrophy
                                        size={12}
                                        className="mr-1 text-yellow-600"
                                      />
                                    )}
                                    {formatClassement(res.classement)}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-700">
                                    {formatClassement(res.classement)}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {new Date(res.date).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {resultsData.length > 5 && (
                        <div className="mt-4 text-center">
                          <button
                            onClick={() => router.push("/resultats")}
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
                          >
                            Voir tous les résultats
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vue mobile optimisée */}
                  {mobileView && (
                    <div className="space-y-4">
                      {resultsData
                        .slice(0, isTableExpanded ? undefined : 3)
                        .map((res, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium text-gray-900">
                                {res.nomActivite}
                              </h3>
                              {parseInt(res.classement || "0") <= 3 ? (
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    res.classement === "1"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : res.classement === "2"
                                        ? "bg-gray-100 text-gray-800"
                                        : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {res.classement === "1" && (
                                    <FaTrophy
                                      size={12}
                                      className="mr-1 text-yellow-600"
                                    />
                                  )}
                                  {formatClassement(res.classement)}
                                </span>
                              ) : (
                                <span className="text-sm bg-gray-100 px-2 py-0.5 rounded-full">
                                  {formatClassement(res.classement)}
                                </span>
                              )}
                            </div>

                            <div className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                              <FaMapMarkerAlt
                                className="text-gray-400"
                                size={12}
                              />
                              {res.lieu}
                            </div>

                            <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                              <span>{res.distance} km</span>
                              <span>
                                {new Date(res.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}

                      {resultsData.length > 3 && !isTableExpanded && (
                        <div className="text-center pt-2">
                          <button
                            onClick={() => setIsTableExpanded(true)}
                            className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                            Voir plus de résultats
                          </button>
                        </div>
                      )}

                      {isTableExpanded && (
                        <div className="text-center pt-2">
                          <button
                            onClick={() => router.push("/resultats")}
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
                          >
                            Voir tous les résultats
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Colonne droite - Graphiques et statistiques */}
            <motion.div variants={fadeIn} className="space-y-6">
              {/* Graphique des kilomètres par compétition */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Progression de l&apos;événement
                  </h2>

                  <div className="mb-4">
                    <label
                      htmlFor="event-select"
                      className="block text-sm font-medium text-gray-500 mb-1"
                    >
                      Sélectionner un événement
                    </label>
                    <select
                      id="event-select"
                      className="w-full p-2 border border-gray-300 rounded-md shadow-xs focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={selectedEvent}
                      onChange={(e) => setSelectedEvent(e.target.value)}
                      disabled={eventNames.length === 0}
                    >
                      {eventNames.length === 0 ? (
                        <option value="">Aucun événement disponible</option>
                      ) : (
                        eventNames.map((name, index) => (
                          <option key={index} value={name}>
                            {name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Statistiques de l'événement */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Participants du club:</span>{" "}
                      {eventStats.participants}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Objectif:</span>{" "}
                      {eventStats.kmMax.toFixed(1)} km
                    </p>
                  </div>

                  {/* Barre de progression avec animations */}
                  <div className="relative w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(pourcentage, 100)}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-700 font-bold">
                      {eventStats.kmParcourus.toFixed(1)} km
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-sm font-medium">
                      {pourcentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistiques par activité */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Statistiques par activité
                  </h2>

                  <div className="mb-4">
                    <label
                      htmlFor="activity-select"
                      className="block text-sm font-medium text-gray-500 mb-1"
                    >
                      Sélectionner une activité
                    </label>
                    <select
                      id="activity-select"
                      className="w-full p-2 border border-gray-300 rounded-md shadow-xs focus:ring-blue-500 focus:border-blue-500 text-sm"
                      value={selectedActivity}
                      onChange={(e) => setSelectedActivity(e.target.value)}
                      disabled={activityNames.length === 0}
                    >
                      {activityNames.length === 0 ? (
                        <option value="">Aucune activité disponible</option>
                      ) : (
                        activityNames.map((name, index) => (
                          <option key={index} value={name}>
                            {name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Graphique pour l'activité sélectionnée */}
                  {activityData.labels.length > 0 ? (
                    <div className="h-64">
                      <Line
                        data={activityData}
                        options={{
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: "Distance (km)",
                              },
                            },
                            x: {
                              title: {
                                display: true,
                                text: "Date",
                              },
                            },
                          },
                          plugins: {
                            legend: {
                              display: false,
                            },
                            tooltip: {
                              backgroundColor: "rgba(0, 0, 0, 0.8)",
                              callbacks: {
                                title: function (tooltipItems: any) {
                                  return tooltipItems[0].label;
                                },
                                label: function (context: any) {
                                  return `Distance: ${context.raw} km`;
                                },
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-sm">
                        Pas de données disponibles pour cette activité
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default ClientDashboardPage;
