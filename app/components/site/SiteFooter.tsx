import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const PARTNERS = [
  {
    src: "/SponsorImg/vernon.png",
    name: "Ville de Vernon",
    url: "https://www.vernon27.fr",
    w: 400,
    h: 400,
  },
  {
    src: "/SponsorImg/LogoEure.png",
    name: "Département de l'Eure",
    url: "https://eureennormandie.fr",
    w: 2048,
    h: 2049,
  },
  {
    src: "/SponsorImg/normandie.png",
    name: "Région Normandie",
    url: "https://www.normandie.fr",
    w: 245,
    h: 205,
  },
  {
    src: "/SponsorImg/LogoSNA.png",
    name: "Seine Normandie Agglomération",
    url: null,
    w: 303,
    h: 166,
  },
  {
    src: "/SponsorImg/ffslc.jpg",
    name: "Fédération Française des Sports et Loisirs Canins",
    url: "https://www.ffslc.com",
    w: 236,
    h: 214,
  },
  {
    src: "/SponsorImg/assurance.png",
    name: "Assureur des adhérents",
    url: null,
    w: 275,
    h: 184,
  },
];

const COLUMNS = [
  {
    title: "Pratiquer",
    links: [
      { href: "/SortieCanine", label: "Sorties" },
      { href: "/listeEvenement", label: "Agenda" },
      { href: "/articles", label: "Articles" },
      {
        href: "https://courses.ffslc.fr/license-ffslc-subscribe",
        label: "Prendre une licence FFSLC",
        external: true,
      },
      {
        href: "https://sublimtout.com/200-canisports-eure",
        label: "Boutique du club",
        external: true,
      },
    ],
  },
  {
    title: "Nous écrire",
    links: [
      {
        href: "mailto:cani.sports.eure@gmail.com",
        label: "cani.sports.eure@gmail.com",
      },
      {
        href: "https://instagram.com/canisports_eure",
        label: "Instagram",
        external: true,
      },
      {
        href: "https://facebook.com/canisports.eure",
        label: "Facebook",
        external: true,
      },
    ],
  },
  {
    title: "Informations",
    links: [
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/politique-confidentialite", label: "Confidentialité" },
      { href: "/conditions_generales", label: "Conditions d'utilisation" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-ink">
      <div className="site-container grid gap-12 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <Image
            src="/logo-noir-SansFond.png"
            alt="Cani-Sports Eure"
            width={72} height={72} className="size-18"
          />
          <p className="mt-5 max-w-xs text-ink-2">
            Club de canisport de l&apos;Eure. On court, on marche et on roule
            avec nos chiens, débutants comme compétiteurs.
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-3 md:col-span-8">
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-semibold text-ink">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-ink-2 hover:text-ink"
                      >
                        {link.label}
                        <ArrowUpRight aria-hidden className="size-3.5" />
                        <span className="sr-only">(nouvel onglet)</span>
                      </a>
                    ) : link.href.startsWith("mailto:") ? (
                      <a
                        href={link.href}
                        className="break-all text-ink-2 hover:text-ink"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-ink-2 hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-rule">
        <div className="site-container py-10">
          <h2 className="text-sm font-semibold text-ink">Avec le soutien de</h2>
          <ul className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-6">
            {PARTNERS.map((partner) => {
              const logo = (
                <Image
                  src={partner.src}
                  alt={partner.name}
                  width={partner.w}
                  height={partner.h}
                  sizes="8rem"
                  className="h-12 w-auto object-contain opacity-70 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
                />
              );
              return (
                <li key={partner.name}>
                  {partner.url ? (
                    <a
                      href={partner.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={partner.name}
                    >
                      {logo}
                    </a>
                  ) : (
                    logo
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="border-t border-rule">
        <p className="site-container py-6 text-sm text-ink-3">
          © <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
          Cani-Sports Eure
        </p>
      </div>
    </footer>
  );
}
