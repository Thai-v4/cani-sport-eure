import Image from "next/image"

export default function Presentation() {
  return (
    <section className="container mx-auto px-4 py-12">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-7">
          <h1 className="text-3xl font-bold mb-6">Présentation de l&apos;association</h1>

          <p className="text-gray-700 mb-8">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
            nulla pariatur.
          </p>

          {/* Featured Image Section */}
          <div className="relative rounded-3xl overflow-hidden mb-8">
            <div className="absolute top-4 left-4 z-10">
              <h3 className="bg-blue-800 text-white px-6 py-2 rounded-lg text-xl">Titre</h3>
            </div>
            <Image
              src="/montagne.jpeg"
              alt="Person running with dog"
              width={600}
              height={400}
              className="w-full object-cover rounded-3xl"
            />
          </div>

          <h2 className="text-2xl font-bold mb-6">Nos valeurs et objectifs</h2>
          <p className="text-gray-700">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
            nulla pariatur.
          </p>
        </div>

        {/* Right Column - Activities */}
        <div className="lg:col-span-5 space-y-8">
          {/* Cross */}
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
              <Image src="/cani-trail.png" alt="Cross icon" width={48} height={48} className="opacity-70" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Cross</h3>
              <p className="text-gray-600">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua.
              </p>
            </div>
          </div>

          {/* Trail */}
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
              <Image src="/cani-trail.png" alt="Trail icon" width={48} height={48} className="opacity-70" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Trail</h3>
              <p className="text-gray-600">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua.
              </p>
            </div>
          </div>

          {/* Marche */}
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
              <Image src="/cani-marche.png" alt="Marche icon" width={48} height={48} className="opacity-70" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Marche</h3>
              <p className="text-gray-600">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua.
              </p>
            </div>
          </div>

          {/* VTT */}
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
              <Image src="/cani-vtt.png" alt="VTT icon" width={48} height={48} className="opacity-70" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">VTT</h3>
              <p className="text-gray-600">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua.
              </p>
            </div>
          </div>

          {/* Trottinette */}
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
              <Image src="/cani-trottinette.png" alt="Trottinette icon" width={48} height={48} className="opacity-70" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Trottinette</h3>
              <p className="text-gray-600">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

