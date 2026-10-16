"use client";

import Calendar from "@/app/components/Calendar";
import PageHeader from "../components/site/PageHeader";

// Calendrier complet du club, événements réservés aux adhérents compris
export default function ClubCalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendrier du club"
        description="Tous les rendez-vous, y compris ceux réservés aux adhérents. Ajoutez un événement à votre propre agenda depuis sa fiche."
      />
      <div className="site-container pb-24">
        <Calendar mode="adherent" />
      </div>
    </>
  );
}
