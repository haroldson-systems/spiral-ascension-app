import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PenLine } from 'lucide-react';

const SPIRAL_NOTES_IMAGE = '/images/modules/spiral-notes.png';
const PERSONAL_WRITINGS_IMAGE = '/images/modules/personal-writings.png';

const cards = [
  {
    id: 'spiral' as const,
    to: '/vault?mode=spiral',
    title: 'Spiral Notes',
    subtitle: 'Notes tied to each module',
    description: 'Your reflections on the teachings — one slot per module. Syncs with lesson pages.',
    icon: BookOpen,
    image: SPIRAL_NOTES_IMAGE,
  },
  {
    id: 'personal' as const,
    to: '/vault?mode=personal',
    title: 'Personal Writings',
    subtitle: 'Journal & free-form entries',
    description: 'Free-form journal entries, tags, voice notes. Search, save, and export anytime.',
    icon: PenLine,
    image: PERSONAL_WRITINGS_IMAGE,
  },
];

function VaultCard({
  to,
  title,
  subtitle,
  description,
  icon: Icon,
  image,
}: {
  to: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  image: string;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <Link to={to} className="block h-full group">
      <div className="h-full bg-gradient-to-br from-[#2d21be] to-[#1a0b2e] rounded-xl overflow-hidden shadow-xl border border-purple-500/20 hover:border-purple-500/40 transition-all flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden">
          {imageError && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-[#2d1b4e] to-[#1a0b2e] flex items-center justify-center">
              <Icon className="h-24 w-24 text-amber-400/30" />
            </div>
          )}
          {!imageError && (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-all group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a0b2e] to-transparent" />
        </div>

        <div className="p-4">
          <h3 className="text-lg font-bold text-[#e8e0ff] mb-1">{title}</h3>
          <p className="text-purple-300 text-sm">{subtitle}</p>
        </div>

        <div className="mt-auto p-4 pt-0 space-y-4">
          <p className="text-sm text-purple-200 line-clamp-3 min-h-[4.5rem]">
            {description}
          </p>
          <span className="block w-full text-center bg-purple-600 text-white font-semibold py-2 rounded-lg transition-colors duration-200 group-hover:bg-purple-500">
            Enter
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function VaultEntryPoint() {
  return (
    <section id="vault-section" className="py-20 px-4 bg-gradient-to-b from-[#1a0b2e] to-[#2d1b4e]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-[#e8e8f0] mb-4">The Vault</h2>
          <p className="text-xl text-[#e8e8f0]/80 max-w-2xl mx-auto leading-relaxed">
            Your inner sanctuary — a safe place to breathe, reflect, and integrate. No judgment. No rush.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {cards.map((card) => (
            <VaultCard key={card.id} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
