import React from 'react';
import Hero from './Hero';
import SpiralLibrary from './SpiralLibrary';
import VaultSection from './VaultSection';
import PracticeLibrary from './PracticeLibrary';
import MoonSync from './MoonSync';
import Footer from './Footer';
import Navigation from './Navigation';
import FloatingActionButton from './FloatingActionButton';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#1a0b2e]">
      <Navigation />
      <FloatingActionButton />

      <Hero />
      <SpiralLibrary />
      <VaultSection />
      <PracticeLibrary />

      <section className="py-20 px-4 bg-gradient-to-b from-[#2d1b4e] to-[#1a0b2e]">
        <div className="max-w-5xl mx-auto">
          <MoonSync />
        </div>
      </section>

      <Footer />
    </div>
  );
}
