"use client";

import { useEffect, useState } from "react";
import EventCard from "./EventCard";
import supabase from "@/lib/supabaseClient";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import BlueBackground from "./backgrounds/BlueBackground";

interface Event {
  id: number;
  titre: string;
  contenu: string;
  date: string;
  created_at: string;
  image_url: string;
  type: string;
  auteur: {
    nom: string;
    avatar_url: string;
  };
}

const LatestEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("evenements")
        .select("*")
        .order("date", { ascending: true })
        .limit(5);

      if (error) {
        console.error("Erreur lors de la récupération des événements:", error);
        return;
      }

      const eventsWithProfiles = await Promise.all(
        data.map(async (event) => {
          const { data: profileData } = await supabase
            .from("profils_publics")
            .select("nom, photo_profil")
            .eq("id", event.id_profil)
            .single();

          return {
            ...event,
            auteur: {
              nom: profileData?.nom || "Auteur inconnu",
              avatar_url: profileData?.photo_profil || "/default-avatar.png",
            },
          };
        })
      );

      setEvents(eventsWithProfiles);
    };

    fetchEvents();
  }, []);

  return (
    <div className="add_border">
      <BlueBackground>
        <div className="p-6 md:p-12">
          <h2 className="text-3xl font-bold primary_title mb-4 text-white">
            Nos derniers évènements
          </h2>

          <div className="flex flex-col md:flex-row justify-between items-start gap-8 py-8">
            {/* Liste des événements */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg w-full md:w-[50%] border-4 border-black add_border">
              <div className="max-h-[500px] overflow-y-auto pr-2">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="border-2 border-blue-900 rounded-xl p-4 mb-4 shadow-md"
                  >
                    <EventCard event={event} isEditable={false} />
                  </div>
                ))}
              </div>
            </div>

            {/* Texte + bouton */}
            <div className="w-full md:w-[40%] text-white">
              <p className="text-base md:text-lg mb-6">
                Du cani-cross aux marches en meute, ne manquez aucun événement
                autour du sport canin ! Retrouvez ici les prochains rendez-vous
                organisés par la communauté.
              </p>

              <Link href="/listeEvenement">
                <button className="bg-yellow-500 text-black font-semibold px-6 py-3 rounded-full flex items-center hover:bg-yellow-600 transition border-black border-2 add_border">
                  Plus d’événements <FaArrowRight className="ml-2" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </BlueBackground>
    </div>
  );
};

export default LatestEvents;
