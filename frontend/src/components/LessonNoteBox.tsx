import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PenLine } from 'lucide-react';
import { fetchSpiralNote, saveSpiralNoteToApi } from '@/lib/vaultApi';

interface LessonNoteBoxProps {
  moduleId: string;
}

export default function LessonNoteBox({ moduleId }: LessonNoteBoxProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSpiralNote(moduleId)
      .then((data) => {
        if (!cancelled) setContent(data?.content ?? '');
      })
      .catch(() => {
        if (!cancelled) setContent('');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveSpiralNoteToApi(moduleId, value).catch(() => {});
      saveTimeoutRef.current = null;
    }, 500);
  };

  return (
    <div className="mt-10 rounded-2xl border-2 border-amber-500/30 bg-[#2d1b4e]/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PenLine className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">Your notes for this lesson</h3>
        </div>
        <Link
          to="/vault"
          className="text-sm text-amber-400/90 hover:text-amber-400 transition-colors"
        >
          View all in Vault →
        </Link>
      </div>
      <p className="text-purple-200/80 text-sm mb-4">
        Write here — it auto-saves and syncs with your Vault. No need to leave the lesson.
      </p>
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Your reflections, worksheet answers, or prompts from above..."
        disabled={loading}
        className="w-full min-h-[140px] bg-[#1a0b2e]/70 text-white rounded-xl p-4 border border-purple-500/20 focus:border-amber-500/40 focus:outline-none resize-y text-sm placeholder:text-purple-400/40 disabled:opacity-70"
      />
      <p className="text-xs text-purple-400/60 mt-2">Auto-saved</p>
    </div>
  );
}
