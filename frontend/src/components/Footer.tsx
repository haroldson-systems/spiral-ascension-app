import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#1a0b2e] border-t border-purple-500/20 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-[#d4af37] font-bold text-lg mb-4">The Spiral</h3>
            <ul className="space-y-2">
              <li><a href="#spiral-section" className="text-[#e8e8f0]/70 hover:text-[#e8e8f0] transition-colors">Teachings</a></li>
              <li><a href="#" className="text-[#e8e8f0]/70 hover:text-[#e8e8f0] transition-colors">Audio Library</a></li>
              <li><a href="#" className="text-[#e8e8f0]/70 hover:text-[#e8e8f0] transition-colors">Daily Reflections</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#d4af37] font-bold text-lg mb-4">Tools</h3>
            <ul className="space-y-2">
              <li><a href="#vault-section" className="text-[#e8e8f0]/70 hover:text-[#e8e8f0] transition-colors">The Vault</a></li>
              <li><a href="#" className="text-[#e8e8f0]/70 hover:text-[#e8e8f0] transition-colors">Practices</a></li>
              <li><a href="#" className="text-[#e8e8f0]/70 hover:text-[#e8e8f0] transition-colors">MoonSync</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#d4af37] font-bold text-lg mb-4">Community</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-[#e8e8f0]/70 hover:text-[#e8e8f0] transition-colors">Echoes</a></li>
              <li><a href="#" className="text-[#e8e8f0]/70 hover:text-[#e8e8f0] transition-colors">Share Your Story</a></li>
              <li><a href="#" className="text-[#e8e8f0]/70 hover:text-[#e8e8f0] transition-colors">Support</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#d4af37] font-bold text-lg mb-4">About</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-[#e8e8f0]/70 hover:text-[#e8e8f0] transition-colors">Mission</a></li>
              <li><a href="#" className="text-[#e8e8f0]/70 hover:text-[#e8e8f0] transition-colors">Books</a></li>
              <li><a href="#" className="text-[#e8e8f0]/70 hover:text-[#e8e8f0] transition-colors">Privacy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-purple-500/20 pt-8 text-center">
          <p className="text-[#e8e8f0]/60 mb-2">
            Couldn't find it, so I built it.
          </p>
          <p className="text-[#e8e8f0]/40 text-sm">
            © 2025 The Spiral Ascension. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
