import React from 'react';
import ChapterCard from './ChapterCard';
import { useSpiralData } from '@/hooks/useSpiralData';

export default function SpiralLibrary() {
  const { modules } = useSpiralData();
  const libraryChapters = modules.filter(ch => ch.tier === undefined);
  return (
    <section id="spiral-section" className="py-20 px-4 bg-gradient-to-b from-[#1a0b2e] to-[#2d1b4e]">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-14">
          <h2 className="text-5xl font-bold text-[#e8e8f0] mb-4">The Spiral Paths</h2>
          <p className="text-xl text-[#e8e8f0]/70 max-w-2xl mx-auto leading-relaxed">
            Prologue. Echo. Primer. And the Three Paths that shape the one who ascends — Initiate, Apprentice, Adept.
          </p>
        </div>

        {/* MODULE GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {libraryChapters.map((chapter) => (
             <ChapterCard key={chapter.id} chapter={chapter} />
          ))}
        </div>

        {/* TAGLINE */}
        <div className="mt-16 text-center">
          <p className="text-[#e8e8f0]/80 text-lg italic">
            Walk with courage. Breathe with intention. Rise through the Spiral.
          </p>
        </div>
      </div>
    </section>
  );
}
