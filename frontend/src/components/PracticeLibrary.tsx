import React from 'react';
import PracticeCard from './PracticeCard';
import { practices } from '../data/practices';
 
export default function PracticeLibrary() {
  return (
    <section id="practice-section" className="py-20 px-4 bg-gradient-to-b from-[#1a0b2e] to-[#2d1b4e]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-[#e8e8f0] mb-4">Ascension Practices</h2>
          <p className="text-xl text-[#e8e8f0]/70 max-w-2xl mx-auto mb-6">
            Advanced breathwork, somatic rituals, and cosmic alignment tools for your spiritual journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {practices.map(practice => (
            <PracticeCard key={practice.id} practice={practice} />
          ))}
        </div>
      </div>
    </section>
  );
}
