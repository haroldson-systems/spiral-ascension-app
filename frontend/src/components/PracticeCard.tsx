import React from 'react';

interface PracticeCardProps {
  practice: {
    id: number;
    title: string;
    category: string;
    duration: string;
    level: string;
    image: string;
    description: string;
    isPremium: boolean;
  };
  onUnlock: () => void;
}

export default function PracticeCard({ practice, onUnlock }: PracticeCardProps) {
  const handleClick = () => {
    if (practice.isPremium) {
      onUnlock();
    } else {
      // Navigate to practice detail
      alert(`Starting ${practice.title}...`);
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-[#2d1b4e] to-[#1a0b2e] rounded-xl overflow-hidden shadow-xl border border-purple-500/20 hover:border-purple-500/40 transition-all group">
      {practice.isPremium && (
        <div className="absolute top-3 right-3 z-10 bg-[#d4af37] text-[#1a0b2e] px-3 py-1 rounded-full text-xs font-bold">
          PREMIUM
        </div>
      )}

      <div className="relative h-48 overflow-hidden">
        <img 
          src={practice.image} 
          alt={practice.title}
          className={`w-full h-full object-cover transition-all ${practice.isPremium ? 'blur-sm group-hover:blur-none' : ''}`}
        />
        {practice.isPremium && (
          <div className="absolute inset-0 bg-[#1a0b2e]/60 flex items-center justify-center group-hover:opacity-0 transition-opacity">
            <svg className="w-12 h-12 text-[#d4af37]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-purple-400 text-xs font-semibold uppercase">{practice.category}</span>
          <span className="text-[#e8e8f0]/40">•</span>
          <span className="text-[#e8e8f0]/60 text-xs">{practice.duration}</span>
        </div>

        <h3 className="text-xl font-bold text-[#e8e8f0] mb-2">{practice.title}</h3>
        
        <p className="text-[#e8e8f0]/70 text-sm mb-4 leading-relaxed">
          {practice.description}
        </p>

        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            practice.level === 'Foundation' ? 'bg-green-500/20 text-green-400' :
            practice.level === 'Intermediate' ? 'bg-blue-500/20 text-blue-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {practice.level}
          </span>

          <button
            onClick={handleClick}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              practice.isPremium 
                ? 'bg-[#d4af37]/20 text-[#d4af37] hover:bg-[#d4af37]/30' 
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {practice.isPremium ? 'Unlock' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );
}
