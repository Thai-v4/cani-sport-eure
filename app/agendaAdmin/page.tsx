"use client";

import { useState, useEffect, useRef } from "react"; // Ajout de useRef
import Calendar from "@/app/components/Calendar";
import SidebarAdmin from "../components/SidebarAdmin";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/Auth/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
// Ajout de nouvelles icônes pour l'interface mobile
import {
  Plus,
  X,
  Calendar as CalendarIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Menu,
  MoreVertical,
  Filter,
  ArrowLeft,
} from "lucide-react";

export default function AgendaPage() {
  // États existants
  const { role, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [currentView, setCurrentView] = useState<"month" | "week" | "day">(
    "month"
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Nouvel état pour le menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // États existants pour les événements
  const [events, setEvents] = useState<any[]>([]);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false); // État pour le modal d'édition
  const [eventToEdit, setEventToEdit] = useState<any>(null); // Événement sélectionné pour l'édition
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [newEventData, setNewEventData] = useState({
    title: "",
    start: "",
    end: "",
    description: "",
    type: "club",
    allDay: false,
    location: "",
    visibility: "public", // Valeur par défaut
  });
  const [editEventData, setEditEventData] = useState<any>({
    id: "",
    title: "",
    start: "",
    end: "",
    description: "",
    type: "club",
    allDay: false,
    location: "",
    visibility: "public", // Valeur par défaut
  });

  // Nouveaux états pour la synchronisation
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Effet pour détecter la taille de l'écran
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Protection de la route - redirection si non admin
  useEffect(() => {
    if (!isAuthLoading && role !== "admin") {
      router.push("/connexion"); // Redirection vers la page de connexion
    }
  }, [role, isAuthLoading, router]);

  // Fonction pour changer la date (à implémenter avec votre composant Calendar)
  const handleDateChange = (direction: "prev" | "next") => {
    // Logique à implémenter pour changer la date
    // Exemple: CalendarRef.current.navigateToDate(newDate);
  };

  // Fonction pour formater l'horodatage de manière conviviale
  const formatSyncTime = (date: Date | null): string => {
    if (!date) return "Pas encore synchronisé";

    const now = new Date();
    const isToday = now.toDateString() === date.toDateString();

    if (isToday) {
      return `aujourd'hui à ${date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return `le ${date.toLocaleDateString("fr-FR")} à ${date.toLocaleTimeString(
        "fr-FR",
        { hour: "2-digit", minute: "2-digit" }
      )}`;
    }
  };

  // Fonction pour récupérer les événements
  const fetchEvents = async () => {
    try {
      setIsEventsLoading(true);
      const response = await fetch("/api/calendar");
      if (!response.ok)
        throw new Error("Erreur lors de la récupération des événements");

      const data = await response.json();
      setEvents(data);

      // Mettre à jour l'heure de synchronisation
      setLastSyncTime(new Date());
    } catch (error) {
      console.error("Erreur lors de la récupération des événements:", error);
    } finally {
      setIsEventsLoading(false);
    }
  };

  // Fonction pour créer un nouvel événement
  const handleCreateEvent = async () => {
    // Vérification des champs obligatoires
    if (!newEventData.title || !newEventData.start) {
      setNotification({
        type: "error",
        message: "Le titre et la date de début sont obligatoires",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Préparation des données pour l'API
      const eventData = {
        title: newEventData.title,
        start: newEventData.start,
        end: newEventData.end || newEventData.start,
        description: newEventData.description,
        color: getColorForEventType(newEventData.type),
        location: newEventData.location,
        allDay: newEventData.allDay,
        visibility: newEventData.visibility, // Ajout de la visibilité
      };


      // Appel à l'API
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la création de l'événement"
        );
      }

      const result = await response.json();

      setNotification({
        type: "success",
        message: "Événement créé avec succès!",
      });

      // Réinitialiser le formulaire
      setNewEventData({
        title: "",
        start: "",
        end: "",
        description: "",
        type: "club",
        allDay: false,
        location: "",
        visibility: "public",
      });

      // Rafraîchir les événements
      fetchEvents();

      // Fermer le modal après un court délai
      setTimeout(() => {
        setIsAddEventModalOpen(false);
        setNotification(null);
      }, 1500);
    } catch (error: any) {
      console.error("Erreur lors de la création de l'événement:", error);
      setNotification({
        type: "error",
        message: error.message || "Une erreur est survenue",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour initialiser le formulaire d'édition avec les données d'un événement
  const initEditForm = (event: any) => {
    // Extraire le type d'événement de la couleur
    let eventType = "club";
    if (event.color === "#10B981") eventType = "competition";
    else if (event.color === "#F59E0B") eventType = "entrainement";

    // Déterminer si c'est un événement sur toute la journée
    const isAllDay =
      event.allDay ||
      (new Date(event.start).getHours() === 0 &&
        new Date(event.start).getMinutes() === 0 &&
        new Date(event.end).getHours() === 23 &&
        new Date(event.end).getMinutes() === 59);

    // Formater les dates pour les champs datetime-local
    const formatDateForInput = (date: Date | string) => {
      const d = new Date(date);
      return d.toISOString().slice(0, 16); // Format YYYY-MM-DDTHH:MM
    };

    setEditEventData({
      id: event.id,
      title: event.title,
      start: formatDateForInput(event.start),
      end: formatDateForInput(event.end),
      description: event.description || "",
      type: eventType,
      allDay: isAllDay,
      location: event.location || "",
      visibility: event.visibility || "public",
    });

    setEventToEdit(event);
    setIsEditEventModalOpen(true);
  };

  // Fonction pour mettre à jour un événement
  const handleUpdateEvent = async () => {
    if (!eventToEdit?.id) return;

    setIsSubmitting(true);
    try {
      // Préparation des données pour l'API
      const eventData = {
        id: eventToEdit.id,
        title: editEventData.title,
        start: editEventData.start,
        end: editEventData.end || editEventData.start,
        description: editEventData.description,
        color: getColorForEventType(editEventData.type),
        location: editEventData.location,
        allDay: editEventData.allDay,
        visibility: editEventData.visibility,
      };


      // Appel à l'API
      const response = await fetch("/api/calendar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Erreur lors de la mise à jour de l'événement"
        );
      }

      setNotification({
        type: "success",
        message: "Événement mis à jour avec succès!",
      });

      // Rafraîchir les événements
      await fetchEvents();

      // Fermer le modal après un court délai
      setTimeout(() => {
        setIsEditEventModalOpen(false);
        setEventToEdit(null);
        setNotification(null);
      }, 1500);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de l'événement:", error);
      setNotification({
        type: "error",
        message: error.message || "Une erreur est survenue",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour supprimer un événement
  const handleDeleteEvent = async () => {
    if (!eventToEdit?.id) return;

    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible."
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Appel à l'API pour supprimer
      const response = await fetch("/api/calendar", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: eventToEdit.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || "Erreur lors de la suppression de l'événement"
        );
      }

      setNotification({
        type: "success",
        message: "Événement supprimé avec succès!",
      });

      // Rafraîchir les événements
      await fetchEvents();

      // Fermer le modal
      setIsEditEventModalOpen(false);
      setEventToEdit(null);

      // Effacer la notification après un délai
      setTimeout(() => {
        setNotification(null);
      }, 1500);
    } catch (error: any) {
      console.error("Erreur lors de la suppression de l'événement:", error);
      setNotification({
        type: "error",
        message: error.message || "Une erreur est survenue",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction utilitaire pour obtenir la couleur selon le type d'événement
  const getColorForEventType = (type: string): string => {
    switch (type) {
      case "competition":
        return "#10B981"; // vert
      case "entrainement":
        return "#F59E0B"; // ambre
      case "club":
      default:
        return "#3B82F6"; // bleu
    }
  };

  // Charger les événements au montage du composant
  useEffect(() => {
    if (role === "admin") {
      fetchEvents();
    }
  }, [role]);

  // Ajoutez cet effet pour une synchronisation périodique (optionnel)
  useEffect(() => {
    // Synchronisation initiale
    if (role === "admin") {
      fetchEvents();
    }

    // Synchronisation périodique toutes les 5 minutes
    const intervalId = setInterval(() => {
      if (role === "admin") {
        fetchEvents();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [role]);

  // État de chargement
  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Chargement de l&apos;agenda...</p>
        </div>
      </div>
    );
  }

  // Redirection automatique si non admin (déjà géré par useEffect)
  if (!isAuthLoading && role !== "admin") return null;

  return (
    <div className="flex h-screen overflow-auto bg-gray-50">
      
      <SidebarAdmin />
      {/* Overlay pour le menu mobile */}
      {isMobileMenuOpen && isMobileView && (
        <div
          className="fixed inset-0 bg-ink/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <main className={`flex-1 flex flex-col ${isFullscreen ? "px-0" : ""}`}>
        {/* En-tête adaptative */}
        <header className="bg-white z-10 border border-rule">
          <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center">
              {isMobileView && (
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 mr-2 rounded-md hover:bg-gray-100"
                  aria-label="Menu"
                >
                  <Menu className="h-5 w-5 text-gray-600" />
                </button>
              )}
              <h1 className="display truncate text-2xl md:text-3xl">
                Agenda
              </h1>
            </div>

            {/* Contrôles de navigation adaptés pour mobile */}
            <div className="flex items-center">
              {/* Boutons de navigation toujours visibles */}
              <div className="flex items-center">
                <button
                  onClick={() => handleDateChange("prev")}
                  className="p-2 rounded-full hover:bg-gray-100"
                  aria-label="Précédent"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <button className="px-2 py-1 sm:px-3 sm:py-1.5 font-medium text-sm sm:text-base">
                  Aujourd&apos;hui
                </button>
                <button
                  onClick={() => handleDateChange("next")}
                  className="p-2 rounded-full hover:bg-gray-100"
                  aria-label="Suivant"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Menu contextuel pour mobile */}
              {isMobileView ? (
                <div className="relative ml-2">
                  <button
                    onClick={() => setIsAddEventModalOpen(true)}
                    className="p-2 rounded-md bg-blue-600 text-white"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="ml-4 flex items-center space-x-1">
                  <button
                    onClick={() => setIsAddEventModalOpen(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Événement
                  </button>
                  <button
                    onClick={() => setIsConfigOpen(!isConfigOpen)}
                    className={`p-1.5 rounded-full ${isConfigOpen ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100 text-gray-600"}`}
                    aria-label="Paramètres"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
                    aria-label={
                      isFullscreen
                        ? "Quitter le mode plein écran"
                        : "Mode plein écran"
                    }
                  >
                    {isFullscreen ? (
                      <Minimize className="h-5 w-5" />
                    ) : (
                      <Maximize className="h-5 w-5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sélecteur de vue pour mobile */}
          {isMobileView && (
            <div className="px-3 py-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 w-full bg-gray-100 rounded-md p-1">
                  <button
                    onClick={() => setCurrentView("month")}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition text-center ${ currentView === "month" ? "bg-white text-gray-800" : "text-gray-600" } border border-rule`}
                  >
                    Mois
                  </button>
                  <button
                    onClick={() => setCurrentView("week")}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition text-center ${ currentView === "week" ? "bg-white text-gray-800" : "text-gray-600" } border border-rule`}
                  >
                    Semaine
                  </button>
                  <button
                    onClick={() => setCurrentView("day")}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition text-center ${ currentView === "day" ? "bg-white text-gray-800" : "text-gray-600" } border border-rule`}
                  >
                    Jour
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Panel de configuration conditionnel - adapté pour mobile */}
          <AnimatePresence>
            {isConfigOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-200 overflow-hidden"
              >
                <div className="px-4 sm:px-6 lg:px-8 py-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium text-gray-700">
                      Options d&apos;affichage
                    </h2>
                    {isMobileView && (
                      <button
                        onClick={() => setIsConfigOpen(false)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded-sm text-blue-600 mr-2"
                      />
                      <span className="text-sm">
                        Afficher les événements passés
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded-sm text-blue-600 mr-2"
                      />
                      <span className="text-sm">Afficher les weekends</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded-sm text-blue-600 mr-2"
                      />
                      <span className="text-sm">
                        Afficher les détails des événements
                      </span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Zone de calendrier - ajout de classes responsive */}
        <div className="flex-1 overflow-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-6">
          <div className="bg-white rounded-xl border border-gray-200 h-full overflow-auto">
            {isEventsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">
                  Chargement des événements...
                </span>
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <CalendarIcon className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-gray-800 mb-2 text-center">
                  Pas d&apos;événements programmés
                </h3>
                <p className="text-gray-500 text-center mb-6 max-w-md text-sm sm:text-base">
                  Commencez à organiser votre calendrier en ajoutant des
                  événements pour vos membres.
                </p>
                <button
                  onClick={() => setIsAddEventModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center transition-colors"
                >
                  <Plus className="h-5 w-5 mr-1.5" />
                  Ajouter un événement
                </button>
              </div>
            ) : (
              <Calendar
                key={events.length}
                mode="admin"
                {...({ events: events, currentView, isMobileView } as any)}
              />
            )}
          </div>
        </div>

        {/* Légende et informations - adaptée pour mobile */}
        <footer className="bg-white border-t border-gray-200 px-3 sm:px-6 lg:px-8 py-2 sm:py-3 text-xs sm:text-sm">
          <div
            className={`flex ${isMobileView ? "flex-col space-y-2" : "flex-wrap items-center gap-4"}`}
          >
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <div className="flex items-center">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500 mr-1.5 sm:mr-2"></span>
                <span>Club</span>
              </div>
              <div className="flex items-center">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 mr-1.5 sm:mr-2"></span>
                <span>Compétition</span>
              </div>
              <div className="flex items-center">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500 mr-1.5 sm:mr-2"></span>
                <span>Entraînement</span>
              </div>
            </div>
            <div
              className={`text-gray-500 text-xs ${!isMobileView && "ml-auto"}`}
            >
              Dernière synchronisation: {formatSyncTime(lastSyncTime)}
              {lastSyncTime && (
                <button
                  onClick={fetchEvents}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                  title="Actualiser"
                  aria-label="Actualiser les données"
                >
                  <svg
                    className="inline-block w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </footer>

        {/* Modal d'ajout d'événement - optimisé pour mobile */}
        <AnimatePresence>
          {isAddEventModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-0 sm:px-4 py-0 sm:py-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-ink/50"
                  onClick={() => setIsAddEventModalOpen(false)}
                ></motion.div>

                <motion.div
                  initial={
                    isMobileView ? { y: "100%" } : { opacity: 0, scale: 0.95 }
                  }
                  animate={isMobileView ? { y: 0 } : { opacity: 1, scale: 1 }}
                  exit={
                    isMobileView ? { y: "100%" } : { opacity: 0, scale: 0.95 }
                  }
                  className={`bg-white z-10 w-full ${ isMobileView ? "fixed bottom-0 left-0 right-0 rounded-t-xl max-h-[90vh] overflow-y-auto" : "rounded-lg max-w-lg" } border border-rule`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* En-tête du modal - adapté pour mobile */}
                  <div className="sticky top-0 bg-white flex justify-between items-center p-3 sm:p-4 border-b border-gray-200">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                      {isMobileView ? (
                        <div className="flex items-center">
                          <button
                            onClick={() => setIsAddEventModalOpen(false)}
                            className="p-1 mr-2 rounded-full hover:bg-gray-100"
                          >
                            <ArrowLeft className="h-5 w-5 text-gray-500" />
                          </button>
                          Nouvel événement
                        </div>
                      ) : (
                        "Ajouter un nouvel événement"
                      )}
                    </h2>
                    {!isMobileView && (
                      <button
                        onClick={() => setIsAddEventModalOpen(false)}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {/* Contenu du modal - version ergonomique */}
                  <div className="p-3 sm:p-4">
                    {notification && (
                      <div
                        className={`mb-4 p-2.5 sm:p-3 rounded-md ${ notification.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200" }`}
                      >
                        <p className="flex items-center">
                          {notification.type === "success" ? (
                            <svg
                              className="h-4 w-4 mr-2"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="h-4 w-4 mr-2"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          {notification.message}
                        </p>
                      </div>
                    )}

                    {/* Formulaire amélioré */}
                    <form
                      className="space-y-5"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleCreateEvent();
                      }}
                    >
                      <div className="grid grid-cols-1 gap-5">
                        {/* Titre de l'événement avec indicateur de champ requis */}
                        <div>
                          <label
                            htmlFor="event-title"
                            className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
                          >
                            Titre de l&apos;événement
                            <span className="text-red-500 ml-1">*</span>
                            <span className="ml-1 text-xs text-gray-400">
                              (obligatoire)
                            </span>
                          </label>
                          <input
                            type="text"
                            id="event-title"
                            value={newEventData.title}
                            onChange={(e) =>
                              setNewEventData({
                                ...newEventData,
                                title: e.target.value,
                              })
                            }
                            className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-200 focus:ring-opacity-50 text-base py-2.5 transition-all duration-200 ease-in-out"
                            placeholder="Ex: Sortie Cani-Cross à Evreux"
                            required
                          />
                        </div>

                        {/* Type d'événement - Version améliorée avec grandes cartes */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type d&apos;événement
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <label
                              className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${ newEventData.type === "club" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30" }`}
                            >
                              <input
                                type="radio"
                                name="event-type"
                                value="club"
                                checked={newEventData.type === "club"}
                                onChange={() =>
                                  setNewEventData({
                                    ...newEventData,
                                    type: "club",
                                  })
                                }
                                className="sr-only" // Invisible mais accessible
                              />
                              <span className="w-4 h-4 rounded-full bg-blue-500 mb-2"></span>
                              <span className="font-medium text-blue-800">
                                Club
                              </span>
                              <span className="text-xs text-gray-500 text-center mt-1">
                                Événements associatifs
                              </span>
                            </label>

                            <label
                              className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${ newEventData.type === "competition" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300 hover:bg-green-50/30" }`}
                            >
                              <input
                                type="radio"
                                name="event-type"
                                value="competition"
                                checked={newEventData.type === "competition"}
                                onChange={() =>
                                  setNewEventData({
                                    ...newEventData,
                                    type: "competition",
                                  })
                                }
                                className="sr-only"
                              />
                              <span className="w-4 h-4 rounded-full bg-green-500 mb-2"></span>
                              <span className="font-medium text-green-800">
                                Compétition
                              </span>
                              <span className="text-xs text-gray-500 text-center mt-1">
                                Épreuves sportives
                              </span>
                            </label>

                            <label
                              className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${ newEventData.type === "entrainement" ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/30" }`}
                            >
                              <input
                                type="radio"
                                name="event-type"
                                value="entrainement"
                                checked={newEventData.type === "entrainement"}
                                onChange={() =>
                                  setNewEventData({
                                    ...newEventData,
                                    type: "entrainement",
                                  })
                                }
                                className="sr-only"
                              />
                              <span className="w-4 h-4 rounded-full bg-amber-500 mb-2"></span>
                              <span className="font-medium text-amber-800">
                                Entraînement
                              </span>
                              <span className="text-xs text-gray-500 text-center mt-1">
                                Sessions de préparation
                              </span>
                            </label>
                          </div>
                        </div>

                        {/* Options de date et heure */}
                        <div>
                          {/* Journée complète - déplacé avant les dates pour modifier le comportement des sélecteurs */}
                          <div className="mb-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newEventData.allDay}
                                onChange={(e) => {
                                  const isAllDay = e.target.checked;
                                  const updatedData = {
                                    ...newEventData,
                                    allDay: isAllDay,
                                  };

                                  // Si on active "journée entière", ajuster les heures
                                  if (isAllDay && updatedData.start) {
                                    const startDate = new Date(
                                      updatedData.start
                                    );
                                    startDate.setHours(0, 0, 0, 0);
                                    updatedData.start = startDate
                                      .toISOString()
                                      .slice(0, 16);

                                    if (updatedData.end) {
                                      const endDate = new Date(updatedData.end);
                                      endDate.setHours(23, 59, 59, 0);
                                      updatedData.end = endDate
                                        .toISOString()
                                        .slice(0, 16);
                                    } else {
                                      const endDate = new Date(startDate);
                                      endDate.setHours(23, 59, 59, 0);
                                      updatedData.end = endDate
                                        .toISOString()
                                        .slice(0, 16);
                                    }
                                  }

                                  setNewEventData(updatedData);
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              <span className="ml-3 text-sm font-medium">
                                Journée entière
                              </span>
                            </label>
                          </div>

                          {/* Champs date/heure */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor="event-start"
                                className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
                              >
                                {newEventData.allDay
                                  ? "Date de début"
                                  : "Date et heure de début"}
                                <span className="text-red-500 ml-1">*</span>
                              </label>
                              <input
                                type={
                                  newEventData.allDay
                                    ? "date"
                                    : "datetime-local"
                                }
                                id="event-start"
                                value={newEventData.start}
                                onChange={(e) =>
                                  setNewEventData({
                                    ...newEventData,
                                    start: e.target.value,
                                  })
                                }
                                className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-200 focus:ring-opacity-50 text-base py-2.5"
                                required
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="event-end"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                {newEventData.allDay
                                  ? "Date de fin"
                                  : "Date et heure de fin"}
                              </label>
                              <input
                                type={
                                  newEventData.allDay
                                    ? "date"
                                    : "datetime-local"
                                }
                                id="event-end"
                                value={newEventData.end}
                                onChange={(e) =>
                                  setNewEventData({
                                    ...newEventData,
                                    end: e.target.value,
                                  })
                                }
                                className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-200 focus:ring-opacity-50 text-base py-2.5"
                              />
                              <p className="mt-1 text-xs text-gray-500">
                                {newEventData.allDay
                                  ? "Si l'événement dure plusieurs jours"
                                  : "Laissez vide pour un événement ponctuel"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Description - avec compteur de caractères */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label
                              htmlFor="event-description"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Description
                            </label>
                            <span className="text-xs text-gray-400">
                              {newEventData.description.length}/500 caractères
                            </span>
                          </div>
                          <textarea
                            id="event-description"
                            rows={3}
                            value={newEventData.description}
                            onChange={(e) =>
                              setNewEventData({
                                ...newEventData,
                                description: e.target.value,
                              })
                            }
                            className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-200 focus:ring-opacity-50 text-base"
                            placeholder="Décrivez votre événement (lieu de rendez-vous, informations pratiques...)"
                            maxLength={500}
                          />
                        </div>

                        {/* Options avancées - format amélioré avec transition */}
                        <div className="border-t pt-3 mt-2">
                          <details className="group">
                            <summary className="flex items-center text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 transition">
                              <svg
                                className="h-4 w-4 mr-2 transition-transform group-open:rotate-180"
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
                              Options avancées
                            </summary>
                            <div className="mt-3 space-y-4 pl-3 border-l border-rule">
                              {/* Lieu de l'événement */}
                              <div>
                                <label
                                  htmlFor="event-location"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Lieu de l&apos;événement
                                </label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg
                                      className="h-5 w-5 text-gray-400"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                    </svg>
                                  </div>
                                  <input
                                    type="text"
                                    id="event-location"
                                    value={newEventData.location}
                                    onChange={(e) =>
                                      setNewEventData({
                                        ...newEventData,
                                        location: e.target.value,
                                      })
                                    }
                                    className="block w-full pl-10 rounded-md border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-200 focus:ring-opacity-50 text-base py-2.5"
                                    placeholder="Adresse ou point de rendez-vous"
                                  />
                                </div>
                              </div>

                              {/* Visibilité de l'événement */}
                              <div>
                                <fieldset>
                                  <legend className="text-sm font-medium text-gray-700 mb-2">
                                    Visibilité de l&apos;événement
                                  </legend>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label
                                      className={`relative flex p-3 bg-white border ${newEventData.visibility === "public" ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-200"} rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 transition-colors`}
                                    >
                                      <input
                                        type="radio"
                                        name="visibility"
                                        value="public"
                                        checked={
                                          newEventData.visibility === "public"
                                        }
                                        onChange={() =>
                                          setNewEventData({
                                            ...newEventData,
                                            visibility: "public",
                                          })
                                        }
                                        className="sr-only"
                                      />
                                      <div className="flex items-center">
                                        <div className="w-6 h-6 mr-3 rounded-full bg-blue-100 flex items-center justify-center">
                                          <svg
                                            className="w-4 h-4 text-blue-600"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-14a1.5 1.5 0 00-1.5 1.5v5.5a1 1 0 001 1h5.5a1.5 1.5 0 000-3h-4V5.5A1.5 1.5 0 0010 4z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                        </div>
                                        <div>
                                          <span className="block text-sm font-medium">
                                            Public
                                          </span>
                                          <span className="block text-xs text-gray-500">
                                            Visible par tous les visiteurs
                                          </span>
                                        </div>
                                      </div>
                                      <div
                                        className={`absolute top-3 right-3 flex items-center justify-center w-5 h-5 border ${newEventData.visibility === "public" ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"} rounded-full`}
                                      >
                                        {newEventData.visibility ===
                                          "public" && (
                                          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                                        )}
                                      </div>
                                    </label>

                                    <label
                                      className={`relative flex p-3 bg-white border ${newEventData.visibility === "members" ? "border-orange-600 ring-2 ring-orange-200" : "border-gray-200"} rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 transition-colors`}
                                    >
                                      <input
                                        type="radio"
                                        name="visibility"
                                        value="members"
                                        checked={
                                          newEventData.visibility === "members"
                                        }
                                        onChange={() =>
                                          setNewEventData({
                                            ...newEventData,
                                            visibility: "members",
                                          })
                                        }
                                        className="sr-only"
                                      />
                                      <div className="flex items-center">
                                        <div className="w-6 h-6 mr-3 rounded-full bg-orange-100 flex items-center justify-center">
                                          <svg
                                            className="w-4 h-4 text-orange-600"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                          </svg>
                                        </div>
                                        <div>
                                          <span className="block text-sm font-medium">
                                            Membres
                                          </span>
                                          <span className="block text-xs text-gray-500">
                                            Visible uniquement par les membres
                                          </span>
                                        </div>
                                      </div>
                                      <div
                                        className={`absolute top-3 right-3 flex items-center justify-center w-5 h-5 border ${newEventData.visibility === "members" ? "border-orange-600 bg-orange-600" : "border-gray-300 bg-white"} rounded-full`}
                                      >
                                        {newEventData.visibility ===
                                          "members" && (
                                          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                                        )}
                                      </div>
                                    </label>
                                  </div>
                                </fieldset>
                              </div>
                            </div>
                          </details>
                        </div>

                        {/* Rappel des champs obligatoires */}
                        <div className="text-xs text-gray-500 mt-2">
                          <span className="text-red-500 mr-1">*</span> Champ
                          obligatoire
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Boutons d'actions - adaptés pour mobile */}
                  <div
                    className={`flex ${isMobileView ? "p-3 border-t" : "justify-end gap-2 p-4 border-t"} border-gray-200`}
                  >
                    {!isMobileView && (
                      <button
                        type="button"
                        onClick={() => setIsAddEventModalOpen(false)}
                        className="px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        disabled={isSubmitting}
                      >
                        Annuler
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCreateEvent}
                      className={`${isMobileView ? "w-full" : ""} px-4 py-2.5 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center transition-colors ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""}`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Création en cours...
                        </>
                      ) : (
                        <>
                          <svg
                            className="mr-2 h-4 w-4"
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
                          Créer l&apos;événement
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal de modification d'événement */}
        <AnimatePresence>
          {isEditEventModalOpen && eventToEdit && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-0 sm:px-4 py-0 sm:py-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-ink/50"
                  onClick={() => setIsEditEventModalOpen(false)}
                ></motion.div>

                <motion.div
                  initial={
                    isMobileView ? { y: "100%" } : { opacity: 0, scale: 0.95 }
                  }
                  animate={isMobileView ? { y: 0 } : { opacity: 1, scale: 1 }}
                  exit={
                    isMobileView ? { y: "100%" } : { opacity: 0, scale: 0.95 }
                  }
                  className={`bg-white z-10 w-full ${ isMobileView ? "fixed bottom-0 left-0 right-0 rounded-t-xl max-h-[90vh] overflow-y-auto" : "rounded-lg max-w-lg" } border border-rule`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* En-tête du modal - adapté pour mobile */}
                  <div className="sticky top-0 bg-white flex justify-between items-center p-3 sm:p-4 border-b border-gray-200">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                      {isMobileView ? (
                        <div className="flex items-center">
                          <button
                            onClick={() => setIsEditEventModalOpen(false)}
                            className="p-1 mr-2 rounded-full hover:bg-gray-100"
                          >
                            <ArrowLeft className="h-5 w-5 text-gray-500" />
                          </button>
                          Modifier l&apos;événement
                        </div>
                      ) : (
                        "Modifier l'événement"
                      )}
                    </h2>
                    {!isMobileView && (
                      <button
                        onClick={() => setIsEditEventModalOpen(false)}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {/* Contenu du modal - version ergonomique */}
                  <div className="p-3 sm:p-4">
                    {notification && (
                      <div
                        className={`mb-4 p-2.5 sm:p-3 rounded-md ${ notification.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200" }`}
                      >
                        <p className="flex items-center">
                          {notification.type === "success" ? (
                            <svg
                              className="h-4 w-4 mr-2"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="h-4 w-4 mr-2"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          {notification.message}
                        </p>
                      </div>
                    )}

                    {/* Formulaire amélioré */}
                    <form
                      className="space-y-5"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdateEvent();
                      }}
                    >
                      <div className="grid grid-cols-1 gap-5">
                        {/* Titre de l'événement avec indicateur de champ requis */}
                        <div>
                          <label
                            htmlFor="event-title-edit"
                            className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
                          >
                            Titre de l&apos;événement
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <input
                            type="text"
                            id="event-title-edit"
                            value={editEventData.title}
                            onChange={(e) =>
                              setEditEventData({
                                ...editEventData,
                                title: e.target.value,
                              })
                            }
                            className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-200 focus:ring-opacity-50 text-base py-2.5 transition-all duration-200 ease-in-out"
                            placeholder="Ex: Sortie Cani-Cross à Evreux"
                            required
                          />
                        </div>

                        {/* Type d'événement - Version améliorée avec grandes cartes */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type d&apos;événement
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <label
                              className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${ editEventData.type === "club" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30" }`}
                            >
                              <input
                                type="radio"
                                name="event-type-edit"
                                value="club"
                                checked={editEventData.type === "club"}
                                onChange={() =>
                                  setEditEventData({
                                    ...editEventData,
                                    type: "club",
                                  })
                                }
                                className="sr-only"
                              />
                              <span className="w-4 h-4 rounded-full bg-blue-500 mb-2"></span>
                              <span className="font-medium text-blue-800">
                                Club
                              </span>
                              <span className="text-xs text-gray-500 text-center mt-1">
                                Événements associatifs
                              </span>
                            </label>

                            <label
                              className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${ editEventData.type === "competition" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300 hover:bg-green-50/30" }`}
                            >
                              <input
                                type="radio"
                                name="event-type-edit"
                                value="competition"
                                checked={editEventData.type === "competition"}
                                onChange={() =>
                                  setEditEventData({
                                    ...editEventData,
                                    type: "competition",
                                  })
                                }
                                className="sr-only"
                              />
                              <span className="w-4 h-4 rounded-full bg-green-500 mb-2"></span>
                              <span className="font-medium text-green-800">
                                Compétition
                              </span>
                              <span className="text-xs text-gray-500 text-center mt-1">
                                Épreuves sportives
                              </span>
                            </label>

                            <label
                              className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${ editEventData.type === "entrainement" ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/30" }`}
                            >
                              <input
                                type="radio"
                                name="event-type-edit"
                                value="entrainement"
                                checked={editEventData.type === "entrainement"}
                                onChange={() =>
                                  setEditEventData({
                                    ...editEventData,
                                    type: "entrainement",
                                  })
                                }
                                className="sr-only"
                              />
                              <span className="w-4 h-4 rounded-full bg-amber-500 mb-2"></span>
                              <span className="font-medium text-amber-800">
                                Entraînement
                              </span>
                              <span className="text-xs text-gray-500 text-center mt-1">
                                Sessions de préparation
                              </span>
                            </label>
                          </div>
                        </div>

                        {/* Options de date et heure */}
                        <div>
                          {/* Journée complète */}
                          <div className="mb-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editEventData.allDay}
                                onChange={(e) => {
                                  const isAllDay = e.target.checked;
                                  const updatedData = {
                                    ...editEventData,
                                    allDay: isAllDay,
                                  };

                                  // Si on active "journée entière", ajuster les heures
                                  if (isAllDay && updatedData.start) {
                                    const startDate = new Date(
                                      updatedData.start
                                    );
                                    startDate.setHours(0, 0, 0, 0);
                                    updatedData.start = startDate
                                      .toISOString()
                                      .slice(0, 16);

                                    if (updatedData.end) {
                                      const endDate = new Date(updatedData.end);
                                      endDate.setHours(23, 59, 59, 0);
                                      updatedData.end = endDate
                                        .toISOString()
                                        .slice(0, 16);
                                    } else {
                                      const endDate = new Date(startDate);
                                      endDate.setHours(23, 59, 59, 0);
                                      updatedData.end = endDate
                                        .toISOString()
                                        .slice(0, 16);
                                    }
                                  }

                                  setEditEventData(updatedData);
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              <span className="ml-3 text-sm font-medium">
                                Journée entière
                              </span>
                            </label>
                          </div>

                          {/* Champs date/heure */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor="event-start-edit"
                                className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
                              >
                                {editEventData.allDay
                                  ? "Date de début"
                                  : "Date et heure de début"}
                                <span className="text-red-500 ml-1">*</span>
                              </label>
                              <input
                                type={
                                  editEventData.allDay
                                    ? "date"
                                    : "datetime-local"
                                }
                                id="event-start-edit"
                                value={editEventData.start}
                                onChange={(e) =>
                                  setEditEventData({
                                    ...editEventData,
                                    start: e.target.value,
                                  })
                                }
                                className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-200 focus:ring-opacity-50 text-base py-2.5"
                                required
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="event-end-edit"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                {editEventData.allDay
                                  ? "Date de fin"
                                  : "Date et heure de fin"}
                              </label>
                              <input
                                type={
                                  editEventData.allDay
                                    ? "date"
                                    : "datetime-local"
                                }
                                id="event-end-edit"
                                value={editEventData.end}
                                onChange={(e) =>
                                  setEditEventData({
                                    ...editEventData,
                                    end: e.target.value,
                                  })
                                }
                                className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-200 focus:ring-opacity-50 text-base py-2.5"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Description - avec compteur de caractères */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label
                              htmlFor="event-description-edit"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Description
                            </label>
                            <span className="text-xs text-gray-400">
                              {editEventData.description?.length || 0}/500
                              caractères
                            </span>
                          </div>
                          <textarea
                            id="event-description-edit"
                            rows={3}
                            value={editEventData.description}
                            onChange={(e) =>
                              setEditEventData({
                                ...editEventData,
                                description: e.target.value,
                              })
                            }
                            className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-200 focus:ring-opacity-50 text-base"
                            placeholder="Décrivez votre événement (lieu de rendez-vous, informations pratiques...)"
                            maxLength={500}
                          />
                        </div>

                        {/* Options avancées - format amélioré avec transition */}
                        <div className="border-t pt-3 mt-2">
                          <details className="group" open>
                            <summary className="flex items-center text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 transition">
                              <svg
                                className="h-4 w-4 mr-2 transition-transform group-open:rotate-180"
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
                              Options avancées
                            </summary>
                            <div className="mt-3 space-y-4 pl-3 border-l border-rule">
                              {/* Lieu de l'événement */}
                              <div>
                                <label
                                  htmlFor="event-location-edit"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Lieu de l&apos;événement
                                </label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg
                                      className="h-5 w-5 text-gray-400"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                    </svg>
                                  </div>
                                  <input
                                    type="text"
                                    id="event-location-edit"
                                    value={editEventData.location}
                                    onChange={(e) =>
                                      setEditEventData({
                                        ...editEventData,
                                        location: e.target.value,
                                      })
                                    }
                                    className="block w-full pl-10 rounded-md border-gray-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-200 focus:ring-opacity-50 text-base py-2.5"
                                    placeholder="Adresse ou point de rendez-vous"
                                  />
                                </div>
                              </div>

                              {/* Visibilité de l'événement */}
                              <div>
                                <fieldset>
                                  <legend className="text-sm font-medium text-gray-700 mb-2">
                                    Visibilité de l&apos;événement
                                  </legend>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label
                                      className={`relative flex p-3 bg-white border ${editEventData.visibility === "public" ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-200"} rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 transition-colors`}
                                    >
                                      <input
                                        type="radio"
                                        name="visibility-edit"
                                        value="public"
                                        checked={
                                          editEventData.visibility === "public"
                                        }
                                        onChange={() =>
                                          setEditEventData({
                                            ...editEventData,
                                            visibility: "public",
                                          })
                                        }
                                        className="sr-only"
                                      />
                                      <div className="flex items-center">
                                        <div className="w-6 h-6 mr-3 rounded-full bg-blue-100 flex items-center justify-center">
                                          <svg
                                            className="w-4 h-4 text-blue-600"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-14a1.5 1.5 0 00-1.5 1.5v5.5a1 1 0 001 1h5.5a1.5 1.5 0 000-3h-4V5.5A1.5 1.5 0 0010 4z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                        </div>
                                        <div>
                                          <span className="block text-sm font-medium">
                                            Public
                                          </span>
                                          <span className="block text-xs text-gray-500">
                                            Visible par tous les visiteurs
                                          </span>
                                        </div>
                                      </div>
                                      <div
                                        className={`absolute top-3 right-3 flex items-center justify-center w-5 h-5 border ${editEventData.visibility === "public" ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"} rounded-full`}
                                      >
                                        {editEventData.visibility ===
                                          "public" && (
                                          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                                        )}
                                      </div>
                                    </label>

                                    <label
                                      className={`relative flex p-3 bg-white border ${editEventData.visibility === "members" ? "border-orange-600 ring-2 ring-orange-200" : "border-gray-200"} rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 transition-colors`}
                                    >
                                      <input
                                        type="radio"
                                        name="visibility-edit"
                                        value="members"
                                        checked={
                                          editEventData.visibility === "members"
                                        }
                                        onChange={() =>
                                          setEditEventData({
                                            ...editEventData,
                                            visibility: "members",
                                          })
                                        }
                                        className="sr-only"
                                      />
                                      <div className="flex items-center">
                                        <div className="w-6 h-6 mr-3 rounded-full bg-orange-100 flex items-center justify-center">
                                          <svg
                                            className="w-4 h-4 text-orange-600"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                          </svg>
                                        </div>
                                        <div>
                                          <span className="block text-sm font-medium">
                                            Membres
                                          </span>
                                          <span className="block text-xs text-gray-500">
                                            Visible uniquement par les membres
                                          </span>
                                        </div>
                                      </div>
                                      <div
                                        className={`absolute top-3 right-3 flex items-center justify-center w-5 h-5 border ${editEventData.visibility === "members" ? "border-orange-600 bg-orange-600" : "border-gray-300 bg-white"} rounded-full`}
                                      >
                                        {editEventData.visibility ===
                                          "members" && (
                                          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                                        )}
                                      </div>
                                    </label>
                                  </div>
                                </fieldset>
                              </div>
                            </div>
                          </details>
                        </div>

                        {/* Rappel des champs obligatoires */}
                        <div className="text-xs text-gray-500 mt-2">
                          <span className="text-red-500 mr-1">*</span> Champ
                          obligatoire
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Boutons d'actions - adaptés pour mobile avec option de suppression */}
                  <div
                    className={`flex ${isMobileView ? "flex-col p-3 gap-2" : "justify-end gap-2 p-4"} border-t border-gray-200`}
                  >
                    {isMobileView && (
                      <button
                        type="button"
                        onClick={handleDeleteEvent}
                        className="w-full px-4 py-2.5 border border-red-300 bg-white text-red-600 font-medium rounded-md hover:bg-red-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors flex items-center justify-center"
                        disabled={isSubmitting}
                      >
                        <svg
                          className="mr-2 h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Supprimer l&apos;événement
                      </button>
                    )}

                    <div className={`flex ${isMobileView ? "w-full" : ""}`}>
                      {!isMobileView && (
                        <>
                          <button
                            type="button"
                            onClick={handleDeleteEvent}
                            className="px-4 py-2.5 border border-red-300 bg-white text-red-600 rounded-md hover:bg-red-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors mr-auto"
                            disabled={isSubmitting}
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsEditEventModalOpen(false)}
                            className="ml-2 px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            disabled={isSubmitting}
                          >
                            Annuler
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={handleUpdateEvent}
                        className={`${isMobileView ? "w-full" : "ml-2"} px-4 py-2.5 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center transition-colors ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""}`}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Mise à jour en cours...
                          </>
                        ) : (
                          <>
                            <svg
                              className="mr-2 h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Mettre à jour l&apos;événement
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
