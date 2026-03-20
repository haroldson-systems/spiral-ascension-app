import React from "react";
import { useNavigate } from "react-router-dom";

interface ChapterCardProps {
  chapter: {
    id: string;
    title: string;
    subtitle: string;
    image?: string;
    description: string;
  };
}

export default function ChapterCard({ chapter }: ChapterCardProps) {
  const navigate = useNavigate();

  const displayImage =
    chapter.image && chapter.image.length > 0
      ? chapter.image
      : "/images/placeholder.jpg";

  return (
    <div
      className="bg-gradient-to-br from-[#2d21be] to-[#1a0b2e] rounded-xl overflow-hidden shadow-xl 
                 border border-purple-500/20 hover:border-purple-500/40 transition-all h-full flex flex-col"
    >

      {/* IMAGE */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={displayImage}
          alt={chapter.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0b2e] to-transparent" />
      </div>

      {/* TEXT BLOCK */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-[#e8e0ff] mb-1">
          {chapter.title}
        </h3>
        <p className="text-purple-300 text-sm">{chapter.subtitle}</p>
        <span className="text-[#4d43ff] text-sm font-semibold">Ch. {chapter.id}</span>
      </div>

      <div className="mt-auto p-4 pt-0 space-y-4">
        <p className="text-sm text-purple-200 line-clamp-3 min-h-[4.5rem]">
          {chapter.description}
        </p>
        <button
          onClick={() => navigate(`/module/${chapter.id}`)}
          className="w-full bg-purple-600 text-white font-semibold py-2 rounded-lg
                     transition-colors duration-200 hover:bg-purple-500">
          Enter Module
        </button>
      </div>
    </div>
  );
}
