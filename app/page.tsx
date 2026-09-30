import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HomeHero from "./components/home/HomeHero";
import HomeSeason from "./components/home/HomeSeason";
import LatestArticles from "./components/home/LatestArticles";
import { DISCIPLINES } from "@/lib/sports";

const FACETS = [
  {
    title: "Débutants bienvenus",
    text: "La cani-marche est accessible à tous : on vient avec son chien, sans contrainte de vitesse.",
  },
  {
    title: "Compétition",
    text: "Licences FFSLC, courses officielles et résultats des adhérents suivis par le club.",
  },
  {
    title: "Organisateur local",
    text: "Le club organise des sorties et des courses dans l'Eure, avec le soutien de ses partenaires.",
  },
  {
    title: "Le chien d'abord",
    text: "Le chien court devant, relié par une ligne élastique : son bien-être passe avant la performance.",
  },
];

const STEPS = [
  {
    title: "Choisissez une sortie",
    text: "Dans l'agenda ou le catalogue des sorties, et venez avec votre chien.",
  },
  {
    title: "Prenez votre licence",
    text: "La licence FFSLC se prend en ligne, pour continuer avec le club et courir en compétition.",
  },
  {
    title: "Créez votre compte adhérent",
    text: "Calendrier complet, résultats, album photo. Le bureau valide votre inscription.",
  },
];

export default function HomePage() {
  return (
    <>
      <HomeHero />

      <div className="relative h-[clamp(16rem,52vw,40rem)] w-full bg-wash">
        <Image
          src="/photos/MainPage_bg.jpg"
          alt="Coureurs et leurs chiens sur un chemin de campagne, au crépuscule"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_70%]"
        />
      </div>

      <section id="club" aria-labelledby="titre-club" className="site-container scroll-mt-16 py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-12">
          <h2 id="titre-club" className="display text-[clamp(2.5rem,5vw,4rem)] md:col-span-4">
            Le club
          </h2>
          <div className="md:col-span-8">
            <p className="max-w-[40rem] text-xl leading-relaxed text-ink md:text-2xl md:leading-snug">
              Cani-Sports Eure réunit celles et ceux qui font du sport avec leur chien : en marchant, en courant, à VTT
              ou en trottinette.
            </p>
            <dl className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {FACETS.map((facet) => (
                <div key={facet.title} className="border-t border-ink pt-4">
                  <dt className="font-semibold text-ink">{facet.title}</dt>
                  <dd className="mt-1.5 text-ink-2">{facet.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <h3 className="display mt-20 text-3xl md:mt-28 md:text-4xl">Les disciplines</h3>
        <ul className="mt-6 divide-y divide-rule border-y border-rule">
          {DISCIPLINES.map((d) => (
            <li key={d.key} className="grid gap-x-8 gap-y-2 py-6 sm:grid-cols-[16rem_1fr] sm:items-baseline">
              <div>
                <p className="display text-2xl sm:text-3xl">{d.label}</p>
                <p className="mt-1 text-sm font-semibold text-ink-2">{d.level}</p>
              </div>
              <p className="max-w-[52ch] text-ink-2">{d.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="border-t border-rule">
        <HomeSeason />
      </div>

      <section aria-labelledby="titre-rejoindre" className="bg-wash">
        <div className="site-container py-16 md:py-24">
          <h2 id="titre-rejoindre" className="display max-w-[14ch] text-[clamp(2.5rem,5vw,4rem)]">
            Venir courir avec nous
          </h2>
          <ol className="relative mt-12 grid gap-10 md:grid-cols-3">
            {/* La ligne de trait relie les trois étapes */}
            <span aria-hidden className="absolute left-0 top-0 hidden h-0.5 w-full bg-line md:block" />
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative border-t-2 border-ink pt-6 md:border-t-0">
                <span aria-hidden className="absolute -top-1.5 left-0 hidden size-3.5 rounded-full border-2 border-line bg-wash md:block" />
                <h3 className="text-xl font-bold">
                  <span className="tabular">{index + 1}.</span> {step.title}
                </h3>
                <p className="mt-2 text-ink-2">{step.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 flex flex-wrap gap-3">
            <Link href="/SortieCanine" className="btn-line">
              Voir les sorties
            </Link>
            <Link href="/inscription" className="btn-quiet">
              Créer un compte adhérent
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="titre-articles" className="site-container py-16 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="titre-articles" className="display text-[clamp(2.5rem,5vw,4rem)]">
            Derniers articles
          </h2>
          <Link href="/articles" className="inline-flex items-center gap-1.5 font-semibold text-line hover:underline">
            Tous les articles
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
        <div className="mt-10">
          <LatestArticles />
        </div>
      </section>
    </>
  );
}
