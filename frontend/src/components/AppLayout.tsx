import React from 'react';
import Hero from './Hero';
import SpiralLibrary from './SpiralLibrary';
import VaultEntryPoint from './VaultEntryPoint';
import PracticeLibrary from './PracticeLibrary';
import MoonSync from './MoonSync';
import Footer from './Footer';
import Navigation from './Navigation';
import FloatingActionButton from './FloatingActionButton';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] via-[#3a2563] to-[#1a0b2e]">
      <Navigation />
      <FloatingActionButton />

      <Hero />
      <SpiralLibrary />
      <VaultEntryPoint />
      <PracticeLibrary />

      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <MoonSync />
        </div>
      </section>

      <Footer />
    </div>
  );
}
