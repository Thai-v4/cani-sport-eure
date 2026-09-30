"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useUpcoming } from "@/lib/agenda";
import SeasonRail from "../site/SeasonRail";

export default function HomeSeason() {
  const { events, loading, failed } = useUpcoming();

  return (
    <section aria-labelledby="titre-saison" className="py-16 md:py-24">
      <div className="site-container flex flex-wrap items-end justify-between gap-4">
        <h2 id="titre-saison" className="display text-[clamp(2.5rem,5vw,4rem)]">
          La saison
        </h2>
        <Link href="/listeEvenement" className="inline-flex items-center gap-1.5 font-semibold text-line hover:underline">
          Tout l&apos;agenda
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
      <div className="bleed-right mt-10">
        <SeasonRail events={events} loading={loading} failed={failed} />
      </div>
    </section>
  );
}
