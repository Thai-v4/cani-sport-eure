"use client";

import Image from "next/image";

// 📌 Images des sports
const sportImages = {
  Cross: "/photos/cross.jpeg",
  Trail: "/photos/trail.jpg",
  Marche: "/photos/marche.jpg",
  Trottinette: "/photos/trotinete.jpeg",
  VTT: "/photos/vtt.png",
};

const SportFilters = ({ selectedSport, onSportChange }) => {
  return (
    <div
      className="flex overflow-x-auto sm:justify-center gap-4 p-4 rounded-full bg-[#3D4A89] mb-6 w-full sm:w-fit sm:mx-auto"
      style={{
        scrollbarWidth: "none", // Firefox
        msOverflowStyle: "none", // IE
      }}
    >
      {/* hide scrollbar for Webkit (Chrome/Safari) */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {Object.keys(sportImages).map((sport) => (
        <div
          key={sport}
          onClick={() => onSportChange(sport === selectedSport ? null : sport)}
          className="relative min-w-[80px] min-h-[80px] sm:w-[100px] sm:h-[100px] rounded-full overflow-hidden cursor-pointer transition-transform duration-300 shrink-0"
          style={{
            border: selectedSport === sport ? "2px solid yellow" : "none",
          }}
        >
          <Image
            src={sportImages[sport]}
            alt={sport}
            width={100}
            height={100}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity duration-300"
          >
            <span className="text-white text-xs font-bold text-center drop-shadow-md">
              {sport}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SportFilters;
