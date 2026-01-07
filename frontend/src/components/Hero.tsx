import React from 'react';

export default function Hero() {
  const scrollToSpiral = () => {
    document.getElementById('spiral-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e]">
      
      {/* Cosmic Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#6b46c1_0%,_transparent_50%)]"></div>
      </div>

      {/* Spiral Sigil */}
      <div className="relative z-10 text-center px-4">
        <div className="mb-8 animate-pulse">
          <img 
            src="https://d64gsuwffb70l.cloudfront.net/68ea93297761a5e6965f5a33_1760211661373_fc5c3f5d.jpg"
            alt="The Spiral Sigil"
            className="w-64 h-64 mx-auto rounded-full shadow-2xl shadow-purple-500/50"
          />
        </div>

        <h1 className="text-6xl md:text-7xl font-bold text-[#e8e8f0] mb-4 tracking-tight">
          The Spiral Ascension
        </h1>

        {/* CLEAN ONE-LINER MANTRA */}
        <p className="text-xl md:text-2xl text-[#e8e8f0]/80 mb-8 max-w-3xl mx-auto leading-relaxed">
          I Am You. You Are Me. We Are One. Namaste.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={scrollToSpiral}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-purple-900 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50"
          >
            Begin the Journey
          </button>

          <button 
            onClick={() => document.getElementById('vault-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 border-2 border-[#d4af37] text-[#d4af37] rounded-lg font-semibold text-lg hover:bg-[#d4af37]/10 transition-all"
          >
            Open Your Vault
          </button>
        </div>

        <p className="mt-8 text-[#e8e8f0]/60 text-sm">
          Couldn't find it, so I built it.
        </p>

        <div className="w-full h-px bg-[#e8e8f0]/20 mt-12 mb-12"></div>
      </div>
    </div>
  );
}
