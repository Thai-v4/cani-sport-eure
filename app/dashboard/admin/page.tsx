"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient"; // Client Supabase
import { useAuth } from "@/app/components/Auth/AuthProvider";
import { motion } from "framer-motion";
import SidebarAdmin from "@/app/components/SidebarAdmin";
import {
  ChevronDown,
  ChevronUp,
  Users,
  FileText,
  Dog,
  MapPin,
  Calendar,
  BarChart2,
  Medal,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Filter,
  Search,
  RefreshCcw,
  Download,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

// Imports nécessaires pour Chart.js
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";

// Enregistrement des éléments Chart.js
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

import { format, parseISO, isBefore, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

// Type pour les résultats
interface Resultat {
  id: string;
  profils?: {
    prenom: string;
    nom: string;
  };
  nomActivite: string;
  lieu: string;
  distance: string;
  classement: string;
  date: string;
  id_evenement: string;
}

// Type pour les événements
interface Evenement {
  id: string;
  titre: string;
  type: string;
  date: string;
  lieu: string;
  description?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { role, isLoading } = useAuth();

  // États pour les filtres et sélections
  const [selectedEvent, setSelectedEvent] = useState<string>("Nom événements");
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [selectedProfil, setSelectedProfil] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("all"); // all, month, quarter, year

  // États pour les données
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [activityNames, setActivityNames] = useState<string[]>([]);
  const [profilNoms, setProfilNoms] = useState<string[]>([]);

  // États pour les statistiques
  const [eventParticipantCount, setEventParticipantCount] = useState(0);
  const [kmParcourus, setKmParcourus] = useState(0);
  const [kmMax, setKmMax] = useState(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalChiens, setTotalChiens] = useState<number>(0);
  const [totalDocuments, setTotalDocuments] = useState<number>(0);
  const [totalKmClub, setTotalKmClub] = useState<number>(0);
  const [kmEvolution, setKmEvolution] = useState<number>(0); // % d'évolution
  const [userEvolution, setUserEvolution] = useState<number>(5); // % d'évolution
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // État pour les tableaux
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "date",
    direction: "desc",
  });

  // État pour les onglets actifs
  const [activeTab, setActiveTab] = useState<"performances" | "resultats">(
    "performances"
  );

  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      try {
        // Récupération des données principales
        const [resultatsResponse, evenementsResponse, participationResponse] =
          await Promise.all([
            supabase.from("resultats").select("*, profils(prenom, nom)"),
            supabase.from("evenements").select("*"),
            supabase.from("participation").select("*"),
          ]);

        if (resultatsResponse.error)
          throw new Error(resultatsResponse.error.message);
        if (evenementsResponse.error)
          throw new Error(evenementsResponse.error.message);
        if (participationResponse.error)
          throw new Error(participationResponse.error.message);

        const resultatsData = resultatsResponse.data || [];
        const evenementsData = evenementsResponse.data || [];
        const participationData = participationResponse.data || [];

        // Mise à jour des états
        setResultats(resultatsData);
        setEvenements(evenementsData);
        setParticipants(participationData);

        // Extraction des activités uniques
        const uniqueActivities = [
          ...new Set(
            resultatsData.map((res: any) => res.nomActivite).filter(Boolean)
          ),
        ].sort();

        setActivityNames(uniqueActivities);
        if (uniqueActivities.length > 0 && !selectedActivity) {
          setSelectedActivity(uniqueActivities[0]);
        }

        // Calcul du total des kilomètres
        const totalKm = resultatsData
          .map((r) => parseFloat(r.distance))
          .filter((k) => !isNaN(k))
          .reduce((acc, val) => acc + val, 0);

        setTotalKmClub(totalKm);

        // Extraction des profils uniques
        const uniquePrenoms = [
          ...new Set(
            resultatsData.map((r: any) => r.profils?.prenom).filter(Boolean)
          ),
        ].sort();

        setProfilNoms(uniquePrenoms);
        if (uniquePrenoms.length > 0 && !selectedProfil) {
          setSelectedProfil(uniquePrenoms[0]);
        }

        // Calcul des statistiques pour l'événement sélectionné
        if (selectedEvent !== "Nom événements") {
          const selected = evenementsData?.find(
            (e) => e.titre === selectedEvent
          );
          if (selected) {
            const resultatsFiltres =
              resultatsData?.filter((r) => r.id_evenement === selected?.id) ||
              [];
            const participationFiltree =
              participationData?.filter(
                (p) => p.id_evenement === selected?.id
              ) || [];

            const kmRealises = resultatsFiltres
              .map((r) => parseFloat(r.distance))
              .filter((k) => !isNaN(k))
              .reduce((acc, val) => acc + val, 0);

            const kmPrevus = participationFiltree.length * 10;

            setEventParticipantCount(participationFiltree.length);
            setKmParcourus(kmRealises);
            setKmMax(kmPrevus > 0 ? kmPrevus : 100); // Éviter division par zéro

            // Calculer l'évolution
            const previousEvents = evenementsData.filter(
              (e) =>
                e.id !== selected.id &&
                isBefore(parseISO(e.date), parseISO(selected.date))
            );
            if (previousEvents.length > 0) {
              const lastEvent = previousEvents.sort((a, b) =>
                isBefore(parseISO(a.date), parseISO(b.date)) ? 1 : -1
              )[0];

              const lastEventResultats = resultatsData.filter(
                (r) => r.id_evenement === lastEvent.id
              );
              const lastKmRealises = lastEventResultats
                .map((r) => parseFloat(r.distance))
                .filter((k) => !isNaN(k))
                .reduce((acc, val) => acc + val, 0);

              if (lastKmRealises > 0) {
                const evolution =
                  ((kmRealises - lastKmRealises) / lastKmRealises) * 100;
                setKmEvolution(Math.round(evolution));
              }
            }
          }
        } else {
          // Réinitialiser les statistiques si aucun événement n'est sélectionné
          setEventParticipantCount(0);
          setKmParcourus(0);
          setKmMax(100);
          setKmEvolution(0);
        }
      } catch (error: any) {
        console.error("❌ Erreur de récupération des données:", error);
        setError(
          error.message ||
            "Une erreur est survenue lors du chargement des données"
        );
      }
    };

    // Récupération des statistiques globales
    const fetchStats = async () => {
      try {
        const [usersResponse, chiensResponse, documentsResponse] =
          await Promise.all([
            supabase
              .from("profils")
              .select("id", { count: "exact", head: true }),
            supabase
              .from("chiens")
              .select("id", { count: "exact", head: true }),
            supabase
              .from("club_documents")
              .select("id", { count: "exact", head: true }),
          ]);

        // Mise à jour des compteurs
        if (usersResponse.count !== null) setTotalUsers(usersResponse.count);
        if (chiensResponse.count !== null) setTotalChiens(chiensResponse.count);
        if (documentsResponse.count !== null)
          setTotalDocuments(documentsResponse.count);
      } catch (error) {
        console.error("❌ Erreur statistiques:", error);
      }
    };

    // Exécuter les requêtes si l'utilisateur est admin
    if (role === "admin") {
      fetchData();
      fetchStats();
    }
  }, [role, selectedEvent, supabase, selectedActivity]);

  // Protection de la route
  useEffect(() => {
    if (!isLoading && role !== "admin") {
      router.push("/connexion");
    }
  }, [isLoading, role, router]);

  // Fonction pour rafraîchir les données
  const refreshData = async () => {
    setIsRefreshing(true);

    try {
      const { data: resultatsData, error: resultatsError } = await supabase
        .from("resultats")
        .select("*, profils(prenom, nom)");

      if (resultatsError) throw resultatsError;

      setResultats(resultatsData || []);

      // Recalculer le total des kilomètres
      const totalKm = resultatsData
        ?.map((r) => parseFloat(r.distance))
        .filter((k) => !isNaN(k))
        .reduce((acc, val) => acc + val, 0);

      setTotalKmClub(totalKm || 0);

      // Afficher notification de succès
      setError(null);
    } catch (error: any) {
      console.error("❌ Erreur de rafraîchissement:", error);
      setError("Impossible de rafraîchir les données. Veuillez réessayer.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculs pour les statistiques
  const kmPourcentage =
    kmMax > 0 ? Math.min((kmParcourus / kmMax) * 100, 100) : 0;
  const countByType = (type: string) =>
    evenements.filter((ev) => ev.type?.toLowerCase() === type.toLowerCase())
      .length;
  const pourcentageExterne =
    evenements.length > 0
      ? Math.round((countByType("externe") / evenements.length) * 100)
      : 0;

  // Filtrage des résultats
  const filteredResultats = resultats
    .filter((r) => r.profils?.prenom === selectedProfil)
    .filter((r) => {
      if (!searchTerm) return true;

      const searchLower = searchTerm.toLowerCase();
      return (
        r.nomActivite?.toLowerCase().includes(searchLower) ||
        r.lieu?.toLowerCase().includes(searchLower) ||
        r.date?.toLowerCase().includes(searchLower)
      );
    })
    .filter((r) => {
      if (dateRange === "all") return true;

      const resultDate = new Date(r.date);
      if (dateRange === "month") return resultDate > subMonths(new Date(), 1);
      if (dateRange === "quarter") return resultDate > subMonths(new Date(), 3);
      if (dateRange === "year") return resultDate > subMonths(new Date(), 12);
      return true;
    });

  // Tri des résultats
  const sortedResultats = [...filteredResultats].sort((a, b) => {
    // Cas spécial pour trier par le prénom (qui est dans un objet profils)
    if (sortConfig.key === "profils.prenom") {
      const aNom = a.profils?.prenom || "";
      const bNom = b.profils?.prenom || "";
      return sortConfig.direction === "asc"
        ? aNom.localeCompare(bNom)
        : bNom.localeCompare(aNom);
    }

    // Cas spécial pour trier par date
    if (sortConfig.key === "date") {
      const aDate = a.date ? new Date(a.date).getTime() : 0;
      const bDate = b.date ? new Date(b.date).getTime() : 0;
      return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
    }

    // Cas spécial pour trier par distance
    if (sortConfig.key === "distance") {
      const aDistance = a.distance ? parseFloat(a.distance) : 0;
      const bDistance = b.distance ? parseFloat(b.distance) : 0;
      return sortConfig.direction === "asc"
        ? aDistance - bDistance
        : bDistance - aDistance;
    }

    // Cas général pour les autres propriétés (qui sont des chaînes)
    const key = sortConfig.key as keyof Resultat;
    const aValue = (a[key] as string) || ""; // Forcer la conversion en string et gérer undefined
    const bValue = (b[key] as string) || "";

    return sortConfig.direction === "asc"
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  // Fonction pour changer le tri
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Calculer les données pour les graphiques
  const prepareChartData = () => {
    // Données pour le graphique d'événements
    const eventChartData = {
      labels: ["Événements externes", "Événements internes"],
      datasets: [
        {
          data: [countByType("externe"), countByType("interne")],
          backgroundColor: ["#2f4591", "#d9e1f2"],
          hoverBackgroundColor: ["#1a2a64", "#b2c2e6"],
          borderWidth: 0,
        },
      ],
    };

    // Données pour le graphique d'activités
    const activitiesMap: Record<string, number> = {};
    resultats.forEach((res) => {
      if (res.nomActivite) {
        activitiesMap[res.nomActivite] =
          (activitiesMap[res.nomActivite] || 0) + 1;
      }
    });

    const activityChartData = {
      labels: Object.keys(activitiesMap).slice(0, 5),
      datasets: [
        {
          label: "Nombre de participations",
          data: Object.keys(activitiesMap)
            .slice(0, 5)
            .map((key) => activitiesMap[key]),
          backgroundColor: "#4c72b0",
          borderColor: "#2c3e50",
          borderWidth: 1,
        },
      ],
    };

    return { eventChartData, activityChartData };
  };

  const { eventChartData, activityChartData } = prepareChartData();

  // Affichage d'un indicateur de chargement
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-medium text-gray-700">
            Chargement du tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarAdmin />

      <main className="flex-1 overflow-auto pb-16">
        {/* Header */}
        <div className="bg-white shadow-xs border-b border-gray-200 px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Tableau de bord administrateur
              </h1>
              <p className="text-gray-600 mt-1">
                Vue d&apos;ensemble des statistiques du club
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
                  isRefreshing
                    ? "bg-gray-100 cursor-not-allowed text-gray-400"
                    : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                }`}
              >
                <RefreshCcw
                  size={16}
                  className={isRefreshing ? "animate-spin" : ""}
                />
                {isRefreshing ? "Actualisation..." : "Actualiser les données"}
              </button>
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mx-8 mt-6 p-4 bg-red-50 border-l-4 border-red-600 rounded-md flex items-start">
            <AlertTriangle
              className="text-red-600 mr-3 shrink-0"
              size={20}
            />
            <div>
              <p className="text-red-700 font-medium">Erreur</p>
              <p className="text-red-600">{error}</p>
            </div>
            <button
              className="ml-auto text-red-600 hover:text-red-800"
              onClick={() => setError(null)}
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="p-8">
          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-xs p-6 border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Adhérents</p>
                  <p className="text-3xl font-bold mt-2">{totalUsers}</p>
                  <div
                    className={`flex items-center mt-2 ${userEvolution >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {userEvolution >= 0 ? (
                      <TrendingUp size={16} className="mr-1" />
                    ) : (
                      <TrendingDown size={16} className="mr-1" />
                    )}
                    <span className="text-sm">
                      {Math.abs(userEvolution)}% ce mois
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Users className="h-7 w-7 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white rounded-xl shadow-xs p-6 border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Chiens</p>
                  <p className="text-3xl font-bold mt-2">{totalChiens}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Ratio:{" "}
                    {totalUsers > 0 ? (totalChiens / totalUsers).toFixed(1) : 0}{" "}
                    chien/adhérent
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <Dog className="h-7 w-7 text-amber-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-white rounded-xl shadow-xs p-6 border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Documents</p>
                  <p className="text-3xl font-bold mt-2">{totalDocuments}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Download size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-500">Accès rapide</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <FileText className="h-7 w-7 text-purple-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-white rounded-xl shadow-xs p-6 border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Distance totale
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {totalKmClub.toFixed(1)} km
                  </p>
                  <div
                    className={`flex items-center mt-2 ${kmEvolution >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {kmEvolution >= 0 ? (
                      <TrendingUp size={16} className="mr-1" />
                    ) : (
                      <TrendingDown size={16} className="mr-1" />
                    )}
                    <span className="text-sm">{kmEvolution}% évolution</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <MapPin className="h-7 w-7 text-emerald-600" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Deuxième ligne - Graphiques et statistiques avancées */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Suivi des kilomètres parcourus par événement */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="bg-white rounded-xl shadow-xs p-6 border border-gray-100"
            >
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Activity className="mr-2 text-gray-700" size={20} />
                Suivi de distance par événement
              </h2>

              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-1 block">
                  Sélectionner un événement
                </label>
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Nom événements">Tous les événements</option>
                  {evenements.map((ev) => (
                    <option key={ev.id} value={ev.titre}>
                      {ev.titre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Participants
                    </p>
                    <p className="text-2xl font-bold">
                      {eventParticipantCount}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">
                      Objectif
                    </p>
                    <p
                      className={`text-xl font-bold ${kmParcourus >= kmMax ? "text-emerald-600" : "text-amber-600"}`}
                    >
                      {kmParcourus.toFixed(1)} / {kmMax.toFixed(1)} km
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${kmParcourus >= kmMax ? "bg-emerald-500" : "bg-blue-600"}`}
                      style={{ width: `${kmPourcentage}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-sm mt-1 text-gray-600">
                    {kmPourcentage.toFixed(0)}% complété
                  </p>
                </div>
              </div>

              {selectedEvent !== "Nom événements" && kmEvolution !== 0 && (
                <div
                  className={`mt-4 p-3 rounded-lg ${kmEvolution >= 0 ? "bg-green-50" : "bg-red-50"} flex items-center`}
                >
                  {kmEvolution >= 0 ? (
                    <TrendingUp className="mr-2 text-green-600" size={18} />
                  ) : (
                    <TrendingDown className="mr-2 text-red-600" size={18} />
                  )}
                  <span
                    className={`text-sm ${kmEvolution >= 0 ? "text-green-700" : "text-red-700"}`}
                  >
                    {kmEvolution >= 0 ? "Augmentation de " : "Diminution de "}
                    <strong>{Math.abs(kmEvolution)}%</strong> par rapport à
                    l&apos;événement précédent
                  </span>
                </div>
              )}
            </motion.div>

            {/* Répartition des événements */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="bg-white rounded-xl shadow-xs p-6 border border-gray-100"
            >
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Calendar className="mr-2 text-gray-700" size={20} />
                Répartition des événements
              </h2>

              <div className="flex items-center gap-6 h-64">
                <div className="flex-1 flex justify-center">
                  <div style={{ width: "220px", height: "220px" }}>
                    {evenements.length > 0 ? (
                      <Doughnut
                        data={eventChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "bottom",
                              labels: {
                                usePointStyle: true,
                                font: {
                                  size: 12,
                                },
                              },
                            },
                          },
                          cutout: "65%",
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">
                          Aucun événement disponible
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">Événements externes</p>
                    <p className="text-xl font-bold">
                      {countByType("externe")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {pourcentageExterne}% du total
                    </p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">Événements internes</p>
                    <p className="text-xl font-bold">
                      {countByType("interne")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {100 - pourcentageExterne}% du total
                    </p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">Total événements</p>
                    <p className="text-xl font-bold">{evenements.length}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Troisième ligne - Graphique d'activités */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="bg-white rounded-xl shadow-xs p-6 border border-gray-100 mt-8"
          >
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <BarChart2 className="mr-2 text-gray-700" size={20} />
              Activités les plus populaires
            </h2>

            <div className="h-64">
              {activityNames.length > 0 ? (
                <Bar
                  data={activityChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          display: true,
                          color: "rgba(0, 0, 0, 0.05)",
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Aucune activité disponible</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Tableaux de résultats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            className="bg-white rounded-xl shadow-xs p-6 border border-gray-100 mt-8"
          >
            <div className="border-b border-gray-200 mb-4">
              <div className="flex items-center justify-between flex-wrap">
                <div className="flex mb-4">
                  <button
                    onClick={() => setActiveTab("performances")}
                    className={`mr-4 pb-3 px-1 ${
                      activeTab === "performances"
                        ? "text-blue-600 border-b-2 border-blue-600 font-medium"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Performance par adhérent
                  </button>
                  <button
                    onClick={() => setActiveTab("resultats")}
                    className={`mr-4 pb-3 px-1 ${
                      activeTab === "resultats"
                        ? "text-blue-600 border-b-2 border-blue-600 font-medium"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Tous les résultats
                  </button>
                </div>

                <div className="flex items-center flex-wrap gap-3 mb-4">
                  {activeTab === "performances" && (
                    <div>
                      <select
                        value={selectedProfil}
                        onChange={(e) => setSelectedProfil(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {profilNoms.map((prenom, index) => (
                          <option key={index} value={prenom}>
                            {prenom}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg pl-10 p-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <button className="flex items-center gap-2 bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg p-2 hover:bg-gray-100">
                      <Filter size={16} />
                      <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-transparent focus:outline-hidden"
                      >
                        <option value="all">Toute période</option>
                        <option value="month">Dernier mois</option>
                        <option value="quarter">Dernier trimestre</option>
                        <option value="year">Dernière année</option>
                      </select>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {activeTab === "performances" && (
                <>
                  {sortedResultats.length > 0 ? (
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            onClick={() => requestSort("profils.prenom")}
                            className="px-4 py-3.5 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                          >
                            <div className="flex items-center">
                              Prénom
                              {sortConfig.key === "profils.prenom" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                ))}
                            </div>
                          </th>
                          <th
                            onClick={() => requestSort("lieu")}
                            className="px-4 py-3.5 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                          >
                            <div className="flex items-center">
                              Lieu
                              {sortConfig.key === "lieu" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                ))}
                            </div>
                          </th>
                          <th
                            onClick={() => requestSort("distance")}
                            className="px-4 py-3.5 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                          >
                            <div className="flex items-center">
                              Distance
                              {sortConfig.key === "distance" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                ))}
                            </div>
                          </th>
                          <th
                            onClick={() => requestSort("classement")}
                            className="px-4 py-3.5 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                          >
                            <div className="flex items-center">
                              Classement
                              {sortConfig.key === "classement" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                ))}
                            </div>
                          </th>
                          <th
                            onClick={() => requestSort("date")}
                            className="px-4 py-3.5 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                          >
                            <div className="flex items-center">
                              Date
                              {sortConfig.key === "date" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                ))}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedResultats.map((res, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                              {res.profils?.prenom || "N/A"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                              {res.lieu || "N/A"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                              {res.distance ? `${res.distance} km` : "N/A"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {res.classement ? (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    parseInt(res.classement) <= 3
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  <Medal
                                    size={12}
                                    className={
                                      parseInt(res.classement) <= 3
                                        ? "mr-1 text-yellow-600"
                                        : "mr-1"
                                    }
                                  />
                                  {res.classement}
                                </span>
                              ) : (
                                "N/A"
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                              {res.date ? (
                                <div className="flex items-center">
                                  <Calendar
                                    size={14}
                                    className="mr-1.5 text-gray-400"
                                  />
                                  {res.date}
                                </div>
                              ) : (
                                "N/A"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-8">
                      <Info size={40} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-lg font-medium text-gray-700 mb-1">
                        Aucun résultat trouvé
                      </p>
                      <p className="text-gray-500 max-w-md mx-auto">
                        {searchTerm
                          ? "Essayez de modifier vos critères de recherche"
                          : "Aucune performance enregistrée pour cet adhérent"}
                      </p>
                    </div>
                  )}
                </>
              )}

              {activeTab === "resultats" && (
                <>
                  {resultats.length > 0 ? (
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3.5 text-left text-sm font-medium text-gray-700">
                            Adhérent
                          </th>
                          <th className="px-4 py-3.5 text-left text-sm font-medium text-gray-700">
                            Compétition
                          </th>
                          <th className="px-4 py-3.5 text-left text-sm font-medium text-gray-700">
                            Lieu
                          </th>
                          <th className="px-4 py-3.5 text-left text-sm font-medium text-gray-700">
                            Distance
                          </th>
                          <th className="px-4 py-3.5 text-left text-sm font-medium text-gray-700">
                            Classement
                          </th>
                          <th className="px-4 py-3.5 text-left text-sm font-medium text-gray-700">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {resultats
                          .filter((res) => {
                            if (!searchTerm) return true;

                            const searchLower = searchTerm.toLowerCase();
                            return (
                              res.nomActivite
                                ?.toLowerCase()
                                .includes(searchLower) ||
                              res.lieu?.toLowerCase().includes(searchLower) ||
                              res.date?.toLowerCase().includes(searchLower) ||
                              res.profils?.prenom
                                ?.toLowerCase()
                                .includes(searchLower) ||
                              res.profils?.nom
                                ?.toLowerCase()
                                .includes(searchLower)
                            );
                          })
                          .filter((res) => {
                            if (dateRange === "all") return true;

                            const resultDate = new Date(res.date);
                            if (dateRange === "month")
                              return resultDate > subMonths(new Date(), 1);
                            if (dateRange === "quarter")
                              return resultDate > subMonths(new Date(), 3);
                            if (dateRange === "year")
                              return resultDate > subMonths(new Date(), 12);
                            return true;
                          })
                          .map((res, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-4 whitespace-nowrap text-sm">
                                <div className="font-medium text-gray-800">
                                  {res.profils?.prenom || "N/A"}{" "}
                                  {res.profils?.nom || ""}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                {res.nomActivite || "N/A"}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                {res.lieu || "N/A"}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                {res.distance ? `${res.distance} km` : "N/A"}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                {res.classement ? (
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      parseInt(res.classement) <= 3
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {parseInt(res.classement) <= 3 && (
                                      <Medal
                                        size={12}
                                        className="mr-1 text-yellow-600"
                                      />
                                    )}
                                    {res.classement}
                                  </span>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                {res.date || "N/A"}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-8">
                      <Info size={40} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-lg font-medium text-gray-700">
                        Aucun résultat trouvé
                      </p>
                      <p className="text-gray-500">
                        Ajoutez des résultats pour commencer à les voir ici
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Pagination (simulée) */}
            {(activeTab === "performances"
              ? sortedResultats.length > 10
              : resultats.length > 10) && (
              <div className="flex items-center justify-between mt-6">
                <div>
                  <p className="text-sm text-gray-700">
                    Affichage de <span className="font-medium">1</span> à{" "}
                    <span className="font-medium">10</span> sur{" "}
                    <span className="font-medium">
                      {activeTab === "performances"
                        ? sortedResultats.length
                        : resultats.length}
                    </span>{" "}
                    résultats
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50">
                    Précédent
                  </button>
                  <button className="px-3 py-1 text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    1
                  </button>
                  <button className="px-3 py-1 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                    2
                  </button>
                  <button className="px-3 py-1 text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50">
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
