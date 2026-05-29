import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">

      {/* Header */}
      <header className="max-w-3xl mx-auto mb-12 border-b border-zinc-800 pb-8">
        <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-2">Sofia, Bulgaria</p>
        <h1 className="text-5xl font-black text-white leading-tight">Workshop<br />Rental</h1>
        <p className="text-zinc-400 mt-3 text-lg">Professional workspace. Book by the hour.</p>
      </header>

      {/* Room Card */}
      <section className="max-w-3xl mx-auto">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">

          {/* Photo placeholder */}
          <div className="bg-zinc-800 h-72 flex items-center justify-center">
            <span className="text-zinc-600 text-sm tracking-widest uppercase">Photo coming soon</span>
          </div>

          {/* Content */}
          <div className="p-8">

            {/* Title + badge */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-white">Workshop Room A</h2>
                <p className="text-zinc-400 mt-1">Fully equipped — tools, benches, good lighting</p>
              </div>
              <span className="bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Available</span>
            </div>

            {/* Details */}
            <div className="grid grid-cols-3 gap-4 my-6 border-t border-b border-zinc-800 py-6">
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Location</p>
                <p className="text-white font-medium">Sofia, BG</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Capacity</p>
                <p className="text-white font-medium">Up to 4 people</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Booking</p>
                <p className="text-white font-medium">By the hour</p>
              </div>
            </div>

            {/* Price + CTA */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-4xl font-black text-white">€10</span>
                <span className="text-zinc-500 ml-2">/ hour</span>
              </div>
              <Link href="/booking">
                <button className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-4 rounded-xl transition text-lg">
                  Book Now →
                </button>
              </Link>
            </div>

          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-zinc-600 text-sm mt-8">Payment by card only · Upfront booking · Instant confirmation</p>
      </section>

    </main>
  );
}
