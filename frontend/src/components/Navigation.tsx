import React, { useState, useEffect } from 'react';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#1a0b2e]/95 backdrop-blur-md border-b border-purple-500/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src="https://d64gsuwffb70l.cloudfront.net/68ea93297761a5e6965f5a33_1760211661373_fc5c3f5d.jpg"
              alt="Spiral"
              className="w-10 h-10 rounded-full"
            />
            <span className="text-[#e8e8f0] font-bold text-xl">Sovereign Spiral</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection('spiral-section')}
              className="text-[#e8e8f0]/70 hover:text-[#e8e8f0] transition-colors"
            >
              Teachings
            </button>

            <button
              onClick={() => scrollToSection('vault-section')}
              className="text-[#e8e8f0]/70 hover:text-[#e8e8f0] transition-colors"
            >
              Vault
            </button>

            <button
              onClick={() => scrollToSection('practice-section')}
              className="text-[#e8e8f0]/70 hover:text-[#e8e8f0] transition-colors"
            >
              Practices
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
