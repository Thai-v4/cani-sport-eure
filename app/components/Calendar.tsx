"use client";

import "moment/locale/fr";
import { useEffect, useState } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import supabase from "@/lib/supabaseClient";
import ModalConfirm from "./ModalConfirm";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";

moment.locale("fr");
const localizer = momentLocalizer(moment);

interface EventData {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  allDay?: boolean;
  location: string;
  description?: string;
  visibility?: string;
}

interface CalendarProps {
  mode?: "admin" | "adherent" | "public";
  hidePrivate?: boolean;
  onEditEvent?: (event: EventData) => void; // Ajout de la prop onEditEvent
}

function parseColorVisibility(description: string = "#3b82f6::public::") {
  const [color, visibility, details] = description.split("::");
  return {
    color: color || "#3b82f6",
    visibility: visibility || "public",
    description: details || "",
  };
}

function generateGoogleCalendarUrl(event: EventData) {
  const format = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]|\.\d{3}/g, "")
      .slice(0, 15) + "Z";
  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
  const text = `&text=${encodeURIComponent(event.title)}`;
  const dates = `&dates=${format(event.start)}/${format(event.end)}`;
  const location = event.location
    ? `&location=${encodeURIComponent(event.location)}`
    : "";
  const details = event.description
    ? `&details=${encodeURIComponent(event.description)}`
    : "";
  return `${base}${text}${dates}${location}${details}`;
}

export default function MyCalendar({
  mode = "public",
  hidePrivate = false,
  onEditEvent, // Récupération de la prop
}: CalendarProps) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventToEdit, setEventToEdit] = useState<EventData | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const isAdmin = mode === "admin";
  const isAdherent = mode === "adherent";

  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");
  const [modeForm, setModeForm] = useState<"create" | "edit">("create");
  const [searchTerm, setSearchTerm] = useState("");
  const [windowWidth, setWindowWidth] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  // 1. Ajoutez un nouvel état pour suivre la vue active
  const [view, setView] = useState<View>("month");
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const isMobileView = windowWidth < 768;

  useEffect(() => {
    const getToken = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token || null;
      setUserToken(token);
    };
    getToken();
  }, []);

  useEffect(() => {
    // Pour utilisateurs non connectés ou en mode public, fetcher les événements sans token
    if (mode === "public" || userToken === null) {
      fetchEvents(null);
    } else {
      // Pour adhérents et admins connectés, utiliser le token
      fetchEvents(userToken);
    }
  }, [userToken, mode]);

  useEffect(() => {
    // Définir la largeur initiale
    setWindowWidth(window.innerWidth);

    // Fonction pour mettre à jour la largeur lors du redimensionnement
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Ajouter l'écouteur d'événement
    window.addEventListener("resize", handleResize);

    // Nettoyer l'écouteur lors du démontage du composant
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const fetchEvents = async (token: string | null = null) => {
    try {
      const res = await fetch("/api/calendar", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setEvents(
          data
            .filter((event: any) => {
              const { visibility } = parseColorVisibility(event.description || "");
              return !(hidePrivate && visibility === "private");
            })
            .map((event: any) => {
              const { color, description, visibility } = parseColorVisibility(event.description || "");
              const start = new Date(event.start.dateTime || event.start.date);
              const end = new Date(event.end.dateTime || event.end.date);
              // Anciens titres préfixés d'un emoji : on les nettoie
              const cleanTitle = event.summary.replace(/^🔒 |^🌍 /, "");
              return {
                id: event.id,
                title: cleanTitle,
                visibility,
                start,
                end,
                color,
                location: event.location,
                description,
              };
            })
        );
      }
    } catch (err) {
      console.error("Erreur API Calendar:", err);
      alert("Impossible de charger les événements.");
    }
  };

  const resetForm = () => {
    setNewTitle("");
    setNewColor("#3b82f6");
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setVisibility("public");
    setLocation("");
    setDetails("");
    setModeForm("create");
    setEventToEdit(null);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (!isAdmin) return;
    setStartDate(start.toISOString().slice(0, 10));
    setStartTime(start.toTimeString().slice(0, 5));
    setEndDate(end.toISOString().slice(0, 10));
    setEndTime(end.toTimeString().slice(0, 5));
    setShowModal(true);
  };

  const handleSelectEvent = (event: EventData) => {
    setEventToEdit(event);
    setSelectedEventId(event.id);
    
    if (isAdmin && typeof onEditEvent === 'function') {
      onEditEvent(event);
      return;
    }
    
    setShowActionModal(true);
  };

  const handleViewChange = (view: View) => {
    setView(view);
  };

  const handleCalendarNavigate = (date: Date, view: any, action: string) => {
    setCurrentDate(date);
  };

  // Ajoutez cette fonction dans votre composant, juste avant le return
  const handleNavigate = (action: string) => {
    if (action === "PREV") {
      setCurrentDate((prevDate) => {
        const newDate = new Date(prevDate);
        newDate.setMonth(newDate.getMonth() - 1);
        return newDate;
      });
    } else if (action === "NEXT") {
      setCurrentDate((prevDate) => {
        const newDate = new Date(prevDate);
        newDate.setMonth(newDate.getMonth() + 1);
        return newDate;
      });
    } else if (action === "TODAY") {
      setCurrentDate(new Date());
    }
  };

  const handleCreateEvent = async () => {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const fullColor = `${newColor}::${visibility}::${details}`;

    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(userToken && { Authorization: `Bearer ${userToken}` }),
      },
      body: JSON.stringify({
        title: newTitle,
        start,
        end,
        color: fullColor,
        location,
        description: details,
      }),
    });

    if (res.ok) {
      fetchEvents(userToken);
      resetForm();
      setShowModal(false);
      setToast({
        show: true,
        message: "Événement créé avec succès !",
        type: "success",
      });
    } else {
      const errorText = await res.text();
      console.error("❌ Erreur lors de la création :", errorText);
      alert("Erreur lors de la création.");
    }
  };

  const handleUpdateEvent = async () => {
    if (!eventToEdit) return;
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const fullColor = `${newColor}::${visibility}::${details}`;

    // 👉 1. Mise à jour sur Google Calendar
    const res = await fetch("/api/calendar", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(userToken && { Authorization: `Bearer ${userToken}` }),
      },
      body: JSON.stringify({
        id: eventToEdit.id,
        title: newTitle,
        start,
        end,
        color: fullColor,
        location,
        description: details,
      }),
    });

    if (!res.ok) {
      alert("Erreur lors de la mise à jour sur Google Calendar.");
      return;
    }

    // 👉 2. Vérifie si l’événement existe dans Supabase (via id_google)
    const { data: existingEvents, error: fetchError } = await supabase
      .from("evenements")
      .select("id")
      .eq("id_google", eventToEdit.id);

    if (fetchError) {
      console.error("Erreur Supabase (fetch):", fetchError);
    }

    if (existingEvents && existingEvents.length > 0) {
      // 👉 3. Mise à jour dans Supabase
      const { error: updateError } = await supabase
        .from("evenements")
        .update({
          titre: newTitle,
          contenu: details,
          date: startDate,
          heure_debut: startTime,
          heure_fin: endTime,
          type: visibility === "public" ? "externe" : "interne",
        })
        .eq("id_google", eventToEdit.id);

      if (updateError) {
        console.error("Erreur Supabase (update):", updateError);
        alert("Échec de la mise à jour dans la base.");
      }
    }

    // 👌 Refresh local
    fetchEvents(userToken);
    resetForm();
    setShowModal(false);
  };

  const deleteEvent = async (eventId: string) => {
    // 👉 1. Suppression dans Google Calendar
    const res = await fetch("/api/calendar", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(userToken && { Authorization: `Bearer ${userToken}` }),
      },
      body: JSON.stringify({ id: eventId }),
    });

    if (!res.ok) {
      alert("Erreur lors de la suppression de l'événement Google.");
      return;
    }

    // 👉 2. Suppression dans Supabase si `id_google` correspond
    const { data: matchedEvents, error: findError } = await supabase
      .from("evenements")
      .select("id")
      .eq("id_google", eventId);

    if (findError) {
      console.error("Erreur recherche Supabase :", findError);
    }

    if (matchedEvents && matchedEvents.length > 0) {
      const { error: deleteError } = await supabase
        .from("evenements")
        .delete()
        .eq("id_google", eventId);

      if (deleteError) {
        console.error("Erreur suppression Supabase :", deleteError);
        alert(
          "Suppression partielle : l’événement a été supprimé de Google mais pas de la base."
        );
      }
    }

    // 👌 Mise à jour locale
    setEvents(events.filter((event) => event.id !== eventId));
  };

  const eventStyleGetter = (event: EventData) => ({
    style: {
      backgroundColor: event.color || "#3b82f6",
      borderRadius: "6px",
      color: "white",
      border: "none",
      padding: "4px",
    },
  });

  const formatEventTime = (start: Date, end: Date) => {
    const formatDate = (d: Date) =>
      d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    const formatHour = (d: Date) =>
      d.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    return `${formatDate(start)} de ${formatHour(start)} à ${formatHour(end)}`;
  };

  // 2. Modifier le filtre des événements pour éviter les événements invalides
  const filteredEvents = events.filter(
    (event) =>
      event && // Vérifier que l'événement existe
      event.title && // Vérifier que le titre existe
      (event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.location &&
          event.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.description &&
          event.description.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Pour la vue mobile, filtrer les événements par mois
  const eventsForMonth = filteredEvents
    .filter(
      (event) =>
        event.start.getMonth() === currentDate.getMonth() &&
        event.start.getFullYear() === currentDate.getFullYear()
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // 3. Conditionnellement rendre le calendrier pour éviter les erreurs pendant le chargement
  return (
    <div className="cse-calendar relative">

      {/* Barre de recherche */}
      <div className="mb-4 relative">
        <label htmlFor="recherche-calendrier" className="sr-only">
          Rechercher un événement
        </label>
        <input
          id="recherche-calendrier"
          type="search"
          placeholder="Rechercher un événement…"
          className="field"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            aria-label="Effacer la recherche"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-ink-3 hover:text-ink"
            onClick={() => setSearchTerm("")}
          >
            <X aria-hidden className="size-4" />
          </button>
        )}
      </div>

      {/* Ne rendre le calendrier que lorsque les données sont valides */}
      {filteredEvents.length > 0 ? (
        windowWidth < 768 ? (
          <div className="mobile-calendar">
            <div className="flex justify-between items-center mb-4">
              <button
                type="button"
                aria-label="Mois précédent"
                onClick={() => handleNavigate("PREV")}
                className="grid size-11 place-items-center border border-rule"
              >
                <ChevronLeft aria-hidden className="size-5" />
              </button>
              <h3 className="text-lg font-bold capitalize">
                {format(currentDate, "MMMM yyyy", { locale: fr })}
              </h3>
              <button
                type="button"
                aria-label="Mois suivant"
                onClick={() => handleNavigate("NEXT")}
                className="grid size-11 place-items-center border border-rule"
              >
                <ChevronRight aria-hidden className="size-5" />
              </button>
            </div>

            {/* Liste d'événements chronologiques au lieu d'une grille */}
            <ul className="event-list divide-y divide-rule border-t border-ink">
              {eventsForMonth
                .slice(0, 15) // Limiter le nombre d'événements affichés
                .map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 py-3 text-left"
                      onClick={() => handleSelectEvent(event)}
                    >
                      <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full" style={{ backgroundColor: event.color || "#1238d6" }} />
                      <span>
                        <span className="block font-medium">{event.title}</span>
                        <span className="block text-sm text-ink-2">{formatEventTime(event.start, event.end)}</span>
                        {event.location && (
                          <span className="mt-1 flex items-center gap-1 text-xs text-ink-3">
                            <MapPin aria-hidden className="size-3" />
                            {event.location}
                          </span>
                        )}
                        {event.visibility === "private" && <span className="mt-1 block text-xs font-semibold text-ink-2">Adhérents</span>}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            selectable={isAdmin}
            views={undefined}
            view={view}
            date={currentDate}
            onView={handleViewChange}
            onNavigate={handleCalendarNavigate}
            defaultView="month"
            style={{ height: "calc(80vh)", minHeight: "500px" }}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            tooltipAccessor={(event) =>
              `${event.title}\n${formatEventTime(event.start, event.end)}\nLieu: ${
                event.location || "Non renseigné"
              }\n${event.description || ""}`
            }
            messages={{
              allDay: "Journée entière",
              previous: "Précédent",
              next: "Suivant",
              today: "Aujourd'hui",
              month: "Mois",
              week: "Semaine",
              day: "Jour",
              agenda: "Agenda",
              date: "Date",
              time: "Heure",
              event: "Événement",
            }}
          />
        )
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          {isLoading ? (
            <p>Chargement des événements...</p>
          ) : (
            <>
              <p className="text-lg mb-2">Aucun événement à afficher</p>
              <p className="text-sm">
                {searchTerm
                  ? "Essayez de modifier votre recherche"
                  : "Revenez plus tard pour voir les événements à venir"}
              </p>
            </>
          )}
        </div>
      )}

      {/* Loader */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 rounded-full border-4 border-t-blue-600 border-blue-200 animate-spin"></div>
            <p className="mt-2 text-blue-600">Chargement des événements...</p>
          </div>
        </div>
      )}

      {/* MODALE ACTIONS */}
      {showActionModal && eventToEdit && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md text-center border border-rule">
            <h3 className="text-lg font-bold mb-4">
              Détail de l&apos;événement
            </h3>
            <p className="mb-2 font-semibold">{eventToEdit.title}</p>
            <p className="mb-2">
              {formatEventTime(eventToEdit.start, eventToEdit.end)}
            </p>
            <p className="mb-2 text-ink-2">
              {eventToEdit.location || "Lieu non renseigné"}
            </p>
            <p className="mb-4 text-ink-2">
              {eventToEdit.description || "Pas de description."}
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              {isAdherent && (
                <a
                  href={generateGoogleCalendarUrl(eventToEdit)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 text-white px-4 py-2 rounded-sm"
                >
                  Importer
                </a>
              )}
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setNewTitle(eventToEdit.title.replace(/^🔒 |^🌍 /, ""));
                      setStartDate(
                        eventToEdit.start.toISOString().slice(0, 10)
                      );
                      setStartTime(
                        eventToEdit.start.toTimeString().slice(0, 5)
                      );
                      setEndDate(eventToEdit.end.toISOString().slice(0, 10));
                      setEndTime(eventToEdit.end.toTimeString().slice(0, 5));
                      setNewColor(eventToEdit.color || "#3b82f6");
                      setLocation(eventToEdit.location || "");
                      setDetails(eventToEdit.description || "");
                      setVisibility(
                        eventToEdit.visibility === "private"
                          ? "private"
                          : "public"
                      );
                      setModeForm("edit");
                      setShowModal(true);
                      setShowActionModal(false);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-sm"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(true);
                      setShowActionModal(false);
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-sm"
                  >
                    Supprimer
                  </button>
                </>
              )}
              <button
                onClick={() => setShowActionModal(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODALE */}
      <ModalConfirm
        isOpen={showDeleteModal}
        title="Supprimer l'événement ?"
        message="Cette action est irréversible."
        confirmText="Confirmer"
        cancelText="Annuler"
        onConfirm={() => {
          if (selectedEventId) {
            deleteEvent(selectedEventId);
            setShowDeleteModal(false);
            setSelectedEventId(null);
          }
        }}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedEventId(null);
        }}
      />

      {/* FORM MODAL */}
      {showModal && (
        <div
          className={`fixed inset-0 bg-ink/50 flex items-center justify-center z-50 transition-opacity duration-300 ${showModal ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md transform transition-transform duration-300 scale-100 border border-rule">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg font-bold">
                {modeForm === "edit"
                  ? "Modifier l'événement"
                  : "Créer un événement"}
              </h3>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                modeForm === "edit" ? handleUpdateEvent() : handleCreateEvent();
              }}
            >
              {/* Champs du formulaire */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Titre
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date de début
                  </label>
                  <input
                    type="date"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Heure de début
                  </label>
                  <input
                    type="time"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Heure de fin
                  </label>
                  <input
                    type="time"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Lieu
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Couleur
                  </label>
                  <input
                    type="color"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Visibilité
                  </label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                  >
                    <option value="public">Public</option>
                    <option value="private">Adhérents uniquement</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowModal(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {modeForm === "edit" ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-sm ${toast.type === "success" ? "bg-green-600" : "bg-red-600"} text-white`}
        >
          {toast.message}
          <button
            onClick={() => setToast({ ...toast, show: false })}
            className="ml-4 text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Appliquer ces styles dans un fichier CSS ou via styled-jsx */}
      <style jsx global>{`
        @media (max-width: 640px) {
          .rbc-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .rbc-toolbar-label {
            margin: 8px 0;
          }

          .rbc-btn-group {
            margin-bottom: 8px;
            justify-content: center;
          }

          .rbc-event {
            padding: 2px 4px !important;
          }
        }
      `}</style>

      {/* Modal d'édition d'événement */}
      {isEditEventModalOpen && eventToEdit && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md border border-rule">
            {/* En-tête du modal */}
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">
              {isMobileView ? (
                <div className="flex items-center">
                  <button
                    onClick={() => setIsEditEventModalOpen(false)}
                    className="p-1 mr-2 rounded-full hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                  </button>
                  <div>
                    <span>Modifier l&apos;événement</span>
                    {eventToEdit.title && (
                      <span className="block text-xs text-gray-500 truncate max-w-[200px]">
                        {eventToEdit.title}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <span>Modifier l&apos;événement</span>
                  {eventToEdit.title && (
                    <span className="block text-sm text-gray-500 font-normal truncate">
                      {eventToEdit.title}
                    </span>
                  )}
                </div>
              )}
            </h2>

            {/* Formulaire d'édition */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateEvent();
              }}
              className="mt-4"
            >
              {/* Champs du formulaire d'édition */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Titre
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date de début
                  </label>
                  <input
                    type="date"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Heure de début
                  </label>
                  <input
                    type="time"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Heure de fin
                  </label>
                  <input
                    type="time"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Lieu
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Couleur
                  </label>
                  <input
                    type="color"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Visibilité
                  </label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                  >
                    <option value="public">Public</option>
                    <option value="private">Adhérents uniquement</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditEventModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
