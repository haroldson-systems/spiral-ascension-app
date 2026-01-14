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
  };
}

export default function PracticeCard({ practice }: PracticeCardProps) {
  const handleClick = () => {
    alert(`Starting ${practice.title}...`);
  };

  return (
    <div className="relative bg-gradient-to-br from-[#2d1b4e] to-[#1a0b2e] rounded-xl overflow-hidden shadow-xl border border-purple-500/20 hover:border-purple-500/40 transition-all group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={practice.image} 
          alt={practice.title}
          className="w-full h-full object-cover transition-all group-hover:scale-105"
        />
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
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all bg-purple-600 text-white hover:bg-purple-700"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}
