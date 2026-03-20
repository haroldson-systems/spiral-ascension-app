import React from 'react';
import { Link } from 'react-router-dom';

interface PracticeCardProps {
  practice: {
    id: string;
    title: string;
    category: string;
    duration: string;
    level: string;
    image: string;
    description: string;
    subtitle?: string;
  };
  variant?: boolean;
  startLabel?: string;
  onStart?: () => void;
  to?: string;
  minimalMeta?: boolean;
}

export default function PracticeCard({
  practice,
  variant = false,
  startLabel = 'Start',
  onStart,
  to,
  minimalMeta = false,
}: PracticeCardProps) {
  const href = to ?? (!variant ? `/practice/${practice.id}` : undefined);
  const useMinimalMeta = minimalMeta || (variant && Boolean(href));
  const cardContents = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={practice.image} 
          alt={practice.title}
          className="w-full h-full object-cover transition-all group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0b2e] to-transparent" />
      </div>

      <div className="p-5 flex flex-1 flex-col">
        {!useMinimalMeta ? (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-400 text-xs font-semibold uppercase">{practice.category}</span>
            <span className="text-[#e8e8f0]/40">•</span>
            <span className="text-[#e8e8f0]/60 text-xs">{practice.duration}</span>
          </div>
        ) : null}

        <h3 className="text-xl font-bold text-[#e8e8f0] mb-2">{practice.title}</h3>
        {practice.subtitle && !useMinimalMeta && (
          <p className="text-[#e8e8f0]/80 text-sm mb-2 leading-relaxed line-clamp-2">
            {practice.subtitle}
          </p>
        )}
        
        <p className={`text-[#e8e8f0]/70 text-sm leading-relaxed ${useMinimalMeta ? 'mb-6 line-clamp-3' : 'mb-4 line-clamp-4'}`}>
          {practice.description}
        </p>

        <div className={`mt-auto ${useMinimalMeta ? 'flex justify-end' : 'flex items-center justify-between gap-3'}`}>
          {!useMinimalMeta ? (
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              practice.level === 'Foundation' ? 'bg-green-500/20 text-green-400' :
              practice.level === 'Intermediate' ? 'bg-blue-500/20 text-blue-400' :
              practice.level === 'Advanced' ? 'bg-red-500/20 text-red-400' :
              'bg-purple-500/20 text-purple-200'
            }`}>
              {practice.level}
            </span>
          ) : null}
          {variant ? (
            href ? (
              <span className="min-w-[96px] text-center px-4 py-2 rounded-lg font-semibold text-sm transition-all bg-purple-600 text-white group-hover:bg-purple-500">
                {startLabel}
              </span>
            ) : (
              <button
                type="button"
                onClick={onStart}
                className="px-4 py-2 rounded-lg font-semibold text-sm transition-all bg-amber-500/90 text-purple-950 hover:bg-amber-400"
              >
                {startLabel}
              </button>
            )
          ) : (
            <span className="min-w-[96px] text-center px-4 py-2 rounded-lg font-semibold text-sm transition-all bg-purple-600 text-white group-hover:bg-purple-500">
              {startLabel}
            </span>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="relative h-full bg-gradient-to-br from-[#2d21be] to-[#1a0b2e] rounded-xl overflow-hidden shadow-xl border border-purple-500/20 hover:border-purple-500/40 transition-all group flex flex-col">
      {href ? (
        <Link to={href} className="flex h-full flex-col">
          {cardContents}
        </Link>
      ) : variant ? (
        <div className="flex h-full flex-col">{cardContents}</div>
      ) : (
        <div className="flex h-full flex-col">{cardContents}</div>
      )}
    </div>
  );
}
