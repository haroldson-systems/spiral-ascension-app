import React from 'react';

const moonPhases = [
  {
    name: "New Moon",
    image: "https://d64gsuwffb70l.cloudfront.net/68eab2d3d61e95e3442aaaf8_1760211757131_666f8d0f.webp",
    ritual: "Set intentions. Plant seeds. Begin anew.",
    energy: "Initiation"
  },
  {
    name: "Waxing Crescent",
    image: "https://d64gsuwffb70l.cloudfront.net/68eab2d3d61e95e3442aaaf8_1760211758963_c20944e6.webp",
    ritual: "Take action. Build momentum. Trust the process.",
    energy: "Growth"
  },
  {
    name: "Full Moon",
    image: "https://d64gsuwffb70l.cloudfront.net/68eab2d3d61e95e3442aaaf8_1760211760742_1daffb7a.webp",
    ritual: "Release what no longer serves. Celebrate completion.",
    energy: "Illumination"
  },
  {
    name: "Waning Crescent",
    image: "https://d64gsuwffb70l.cloudfront.net/68eab2d3d61e95e3442aaaf8_1760211762473_2451863d.webp",
    ritual: "Rest. Reflect. Integrate the lessons.",
    energy: "Surrender"
  }
];

export default function MoonSync() {
  const [currentPhase] = React.useState(2); // Full Moon as example

  return (
    <div className="bg-gradient-to-br from-[#2d1b4e] to-[#1a0b2e] rounded-xl p-8 shadow-xl border border-purple-500/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-[#e8e8f0]">MoonSync</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="text-center">
          <img 
            src={moonPhases[currentPhase].image}
            alt={moonPhases[currentPhase].name}
            className="w-48 h-48 mx-auto rounded-full shadow-2xl shadow-purple-500/30 mb-4"
          />
          <h3 className="text-2xl font-bold text-[#e8e8f0] mb-2">
            {moonPhases[currentPhase].name}
          </h3>
          <p className="text-purple-300 text-sm">Current Phase</p>
        </div>

        <div className="flex flex-col justify-center">
          <div className="mb-6">
            <h4 className="text-[#d4af37] font-semibold mb-2">Energy:</h4>
            <p className="text-[#e8e8f0] text-lg">{moonPhases[currentPhase].energy}</p>
          </div>
          
          <div>
            <h4 className="text-[#d4af37] font-semibold mb-2">Ritual Guidance:</h4>
            <p className="text-[#e8e8f0]/80 leading-relaxed">
              {moonPhases[currentPhase].ritual}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {moonPhases.map((phase, index) => (
          <div
            key={phase.name}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              index === currentPhase
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-purple-500/20 hover:border-purple-500/40'
            }`}
          >
            <img 
              src={phase.image}
              alt={phase.name}
              className="w-full aspect-square rounded-full mb-2"
            />
            <p className="text-[#e8e8f0] text-xs text-center">{phase.name}</p>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all">
        Open MoonSync Tracker
      </button>
    </div>
  );
}
