import React from "react";
import { Link } from "react-router-dom";
import { spiralChapters } from "../data/spiralChapters";

interface TierGridProps {
  tier?: number;            // default = 1 (Initiate)
}

/** Responsive grid of module cards for a given tier */
export default function TierGrid({ tier = 1 }: TierGridProps) {
  // keep only the modules that belong to the requested tier
  const modules = spiralChapters.filter(m => m.tier === tier);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
      {modules.map(mod => (
        <div
          key={mod.id}
          className="bg-gradient-to-br from-[#2d21be] to-[#1a0b2e] rounded-xl overflow-hidden shadow-xl
                     border border-purple-500/20 hover:border-purple-500/40 transition-all"
        >
          {mod.image && (
            <img src={mod.image} alt={mod.title} className="w-full h-48 object-cover" />
          )}

          <div className="p-6">
            <h3 className="text-2xl font-bold mb-2">{mod.title}</h3>
            {mod.subtitle && <p className="text-purple-300 mb-4">{mod.subtitle}</p>}

            <Link
              to={`/module/${mod.id}/tier/${tier}`}
              className="inline-block px-4 py-2 bg-purple-600 rounded-lg text-white hover:bg-purple-700 transition"
            >
              Enter Lesson
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
