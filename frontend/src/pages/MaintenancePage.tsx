export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#12081f] via-[#24123f] to-[#12081f] text-white">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="space-y-6 rounded-3xl border border-purple-700/40 bg-purple-950/40 p-10 shadow-2xl backdrop-blur">
          <p className="text-xs uppercase tracking-[0.45em] text-purple-300">Temporary Pause</p>
          <h1 className="text-4xl font-bold text-white md:text-5xl">Spiral Ascension is temporarily offline.</h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-purple-100/85">
            The site is in maintenance mode for a short reset and refinement window. Please check back soon.
          </p>
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Returning shortly</p>
        </div>
      </main>
    </div>
  );
}
