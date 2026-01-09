import React, { useState } from 'react';
import PracticeCard from './PracticeCard';
import { practices } from '../data/practices';
 
export default function PracticeLibrary() {
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const handleUnlock = () => {
    setShowUnlockModal(true);
  };

  return (
    <section id="practice-section" className="py-20 px-4 bg-gradient-to-b from-[#1a0b2e] to-[#2d1b4e]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-[#e8e8f0] mb-4">Ascension Practices</h2>
          <p className="text-xl text-[#e8e8f0]/70 max-w-2xl mx-auto mb-6">
            Advanced breathwork, somatic rituals, and cosmic alignment tools. Unlock through book purchases or subscription.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {practices.map(practice => (
            <PracticeCard key={practice.id} practice={practice} onUnlock={handleUnlock} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <button className="px-8 py-4 bg-gradient-to-r from-[#d4af37] to-[#b8941f] text-[#1a0b2e] rounded-lg font-bold text-lg hover:shadow-xl hover:shadow-[#d4af37]/30 transition-all transform hover:scale-105">
            Unlock All Practices
          </button>
        </div>
      </div>

      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a0b2e]/95 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-[#2d1b4e] to-[#1a0b2e] rounded-2xl max-w-md w-full p-8 border border-[#d4af37]/30">
            <h3 className="text-2xl font-bold text-[#e8e8f0] mb-4">Unlock Premium Practices</h3>
            <p className="text-[#e8e8f0]/80 mb-6">
              Access advanced rituals, breathwork, and MoonSync through:
            </p>
            <div className="space-y-3 mb-6">
              <div className="p-4 bg-purple-600/20 rounded-lg border border-purple-500/30">
                <p className="text-[#e8e8f0] font-semibold">📚 Book Purchase</p>
                <p className="text-[#e8e8f0]/70 text-sm">Buy any Sovereign Spiral book to unlock modules</p>
              </div>
              <div className="p-4 bg-purple-600/20 rounded-lg border border-purple-500/30">
                <p className="text-[#e8e8f0] font-semibold">⭐ Subscription</p>
                <p className="text-[#e8e8f0]/70 text-sm">$9.99/month for full access</p>
              </div>
            </div>
            <button
              onClick={() => setShowUnlockModal(false)}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
