import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export default function Sponsor() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const autoScrollTimerRef = useRef(null);
  
  // Données des sponsors avec URL et descriptions
  const sponsors = [
    { 
      src: "/SponsorImg/vernon.png", 
      alt: "Vernon", 
      url: "https://www.vernon27.fr",
      description: "Ville partenaire de nos événements locaux"
    },
    { 
      src: "/SponsorImg/normandie.png", 
      alt: "Région Normandie", 
      url: "https://www.normandie.fr",
      description: "Soutien régional pour le développement du sport canin"
    },
    { 
      src: "/SponsorImg/assurance.png", 
      alt: "Assurance Poitiers", 
      url: "#",
      description: "Assureur officiel de nos adhérents"
    },
    { 
      src: "/SponsorImg/ffslc.jpg", 
      alt: "FFSLC", 
      url: "https://www.ffslc.com",
      description: "Fédération Française des Sports et Loisirs Canins"
    },
    { 
      src: "/SponsorImg/LogoEure.png", 
      alt: "Eure", 
      url: "https://eureennormandie.fr",
      description: "Département partenaire du club"
    },
    { 
      src: "/SponsorImg/LogoSNA.png", 
      alt: "SNA", 
      url: "#",
      description: "Seine Normandie Agglomération"
    }
  ];

  // Fonction pour aller au sponsor suivant
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === sponsors.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Fonction pour aller au sponsor précédent
  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? sponsors.length - 1 : prevIndex - 1
    );
  };

  // Fonction pour aller à un sponsor spécifique
  const goToSlide = (index) => {
    setCurrentIndex(index);
    resetAutoScroll(); // Réinitialise le défilement auto quand l'utilisateur navigue manuellement
  };

  // Démarrer/redémarrer le défilement automatique
  const resetAutoScroll = () => {
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
    }
    
    if (isAutoScrolling) {
      autoScrollTimerRef.current = setInterval(() => {
        nextSlide();
      }, 3000);
    }
  };

  // Configurer le défilement automatique lors du montage du composant
  useEffect(() => {
    resetAutoScroll();
    
    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
    };
  }, [isAutoScrolling]); // S'exécute quand isAutoScrolling change

  // Pause/reprise du défilement au survol (pour desktop)
  const handleMouseEnter = () => setIsAutoScrolling(false);
  const handleMouseLeave = () => setIsAutoScrolling(true);

  return (
    <section id="sponsors" className="bg-white text-black py-16 px-6 sm:px-16">
      <div className="container mx-auto">
        <h2 className="text-2xl font-bold mb-6 primary_title_black text-center">Nos partenaires</h2>

        {/* Version desktop - visible uniquement sur md et plus grand */}
        <div className="hidden md:flex justify-center items-center gap-10 flex-wrap">
          {sponsors.map((sponsor, index) => (
            <a 
              key={index}
              href={sponsor.url || "#"} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-60 h-24 flex justify-center group relative"
            >
              <Image
                src={sponsor.src}
                alt={sponsor.alt}
                width={400}
                height={400}
                className="object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <div className="opacity-0 group-hover:opacity-100 absolute -bottom-10 left-0 right-0 bg-blue-600 text-white p-2 rounded-sm text-xs text-center transition-opacity duration-300 z-10">
                {sponsor.description}
              </div>
            </a>
          ))}
        </div>

        {/* Version mobile - visible uniquement sur petits écrans */}
        <div 
          className="md:hidden relative" 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Carrousel */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {sponsors.map((sponsor, index) => (
                <div 
                  key={index} 
                  className="w-full shrink-0 flex flex-col items-center"
                >
                  <a 
                    href={sponsor.url || "#"}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-60 h-24 flex justify-center mb-3"
                  >
                    <Image
                      src={sponsor.src}
                      alt={sponsor.alt}
                      width={400}
                      height={400}
                      className="object-contain"
                    />
                  </a>
                  <p className="text-sm text-center text-gray-600 max-w-xs">
                    {sponsor.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Boutons de navigation */}
          <button 
            onClick={prevSlide} 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-sm hover:bg-white"
            aria-label="Sponsor précédent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            onClick={nextSlide} 
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-sm hover:bg-white"
            aria-label="Sponsor suivant"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Indicateurs de position */}
          <div className="flex justify-center mt-4 gap-1.5">
            {sponsors.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-blue-600 w-5' : 'bg-gray-300'
                }`}
                aria-label={`Aller au sponsor ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}