"use client"; // Indique que ce composant s'exécute côté client

import supabase from "@/lib/supabaseClient"; // Client Supabase pour les requêtes de données
import SidebarAdmin from "../components/SidebarAdmin";
import { useEffect, useState } from "react";
import ResultsTable from "../components/ResultsTable"; // Tableau des résultats de compétitions
import PerformanceTable from "../components/PerformanceTable"; // Tableau des performances
import StatisticsCard from "../components/StatisticsCard"; // Cartes de statistiques

// Types pour les données de résultats de compétitions
interface Result {
  id: number;
  adherent: string;
  competition: string;
  lieu: string;
  distance: string;
  classement: string;
  date: string;
}

// Types pour les données de performances
interface Performance {
  id: number;
  adherent: string;
  lieu: string;
  distance: string;
  classement: string;
  date: string;
}

// Types pour les statistiques globales
interface Stats {
  participants: number;
  km: number;
  events: number;
  internalPercentage: string;
  externalPercentage: string;
}

// Type pour un événement
interface Event {
  type: "interne" | "externe";
}

// Props pour le composant StatisticsCard
interface StatisticsCardProps {
  title: string;
  value: number | string;
  className?: string;
}

export default function Dashboard() {
  // États pour stocker les données récupérées de Supabase
  const [results, setResults] = useState<Result[]>([]);
  const [performance, setPerformance] = useState<Performance[]>([]);
  const [stats, setStats] = useState<Stats>({
    participants: 0,
    km: 0,
    events: 0,
    internalPercentage: "0",
    externalPercentage: "0",
  });

  useEffect(() => {
    // Récupération des données depuis Supabase
    const fetchData = async () => {
      const { data: resultsData } = await supabase.from("results").select("*");
      const { data: performanceData } = await supabase
        .from("performance")
        .select("*");
      const { data: statsData } = await supabase
        .from("stats")
        .select("*")
        .single();
      const { data: eventsData } = await supabase
        .from("evenement")
        .select("type");

      // Calcul des statistiques d'événements
      const totalEvents = eventsData ? eventsData.length : 0;
      const internalEvents = eventsData
        ? eventsData.filter((event: Event) => event.type === "interne").length
        : 0;
      const externalEvents = totalEvents - internalEvents;

      // Calcul des pourcentages
      const internalPercentage =
        totalEvents > 0 ? (internalEvents / totalEvents) * 100 : 0;
      const externalPercentage =
        totalEvents > 0 ? (externalEvents / totalEvents) * 100 : 0;

      // Mise à jour des états avec les données récupérées
      setResults(resultsData || []);
      setPerformance(performanceData || []);
      setStats({
        participants: statsData?.participants || 0,
        km: statsData?.km || 0,
        events: totalEvents,
        internalPercentage: internalPercentage.toFixed(2),
        externalPercentage: externalPercentage.toFixed(2),
      });
    };
    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen bg-wash">
      <SidebarAdmin />
      <div className="flex-1 p-6 md:p-10">
      <h1 className="display mb-8 text-3xl md:text-4xl">Statistiques</h1>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Tableau des résultats de compétition */}
      <ResultsTable
        data={results}
        className="bg-white p-4 border border-rule"
      />

      {/* Tableau des performances */}
      <PerformanceTable
        data={performance}
        className="bg-white p-4 border border-rule"
      />

      {/* Cartes de statistiques */}
      <StatisticsCard
        title="Nombre de participants par événement"
        value={stats.participants}
        className="bg-white p-4 border border-rule"
      />
      <StatisticsCard
        title="Nombre de kilomètres parcourus"
        value={stats.km}
        className="bg-white p-4 border border-rule"
      />
      <StatisticsCard
        title="Nombre d'événements"
        value={stats.events}
        className="bg-white p-4 border border-rule"
      />
      <StatisticsCard
        title="Événements internes"
        value={`${stats.internalPercentage} %`}
        className="bg-white p-4 border border-rule"
      />
      <StatisticsCard
        title="Événements externes"
        value={`${stats.externalPercentage} %`}
        className="bg-white p-4 border border-rule"
      />
    </div>
      </div>
    </div>
  );
}
