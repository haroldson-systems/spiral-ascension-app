import React, { useState, useEffect, useCallback } from 'react';
import { spiralChapters, SpiralModule } from '@/data/spiralChapters';
import { fetchSpiralNote, saveSpiralNoteToApi } from '@/lib/vaultApi';
import { PenLine } from 'lucide-react';

const TIER_NAMES: Record<number, string> = {
  1: 'Path of the Initiate',
  2: 'Path of the Apprentice',
  3: 'Path of the Adept',
};

const spiralModules = spiralChapters.filter(
  (ch): ch is SpiralModule & { tier: number } =>
    typeof ch.tier === 'number' && ch.tier >= 1 && ch.tier <= 3
) as (SpiralModule & { tier: number })[];

const byTier = spiralModules.reduce<Record<number, (SpiralModule & { tier: number })[]>>(
  (acc, m) => {
    const t = m.tier!;
    if (!acc[t]) acc[t] = [];
    acc[t].push(m);
    return acc;
  },
  {}
);

const firstModuleId = byTier[1]?.[0]?.id ?? null;

export default function SpiralNotesView() {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(firstModuleId);

  const loadNotes = useCallback(async () => {
    const loaded: Record<string, string> = {};
    await Promise.all(
      spiralModules.map(async (m) => {
        try {
          const data = await fetchSpiralNote(m.id);
          if (data?.content) loaded[m.id] = data.content;
        } catch {
          /* ignore */
        }
      })
    );
    setNotes(loaded);
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleChange = (moduleId: string, content: string) => {
    setNotes((prev) => ({ ...prev, [moduleId]: content }));
    saveSpiralNoteToApi(moduleId, content).catch(() => {});
  };

  const selectedModule = selectedModuleId
    ? spiralModules.find((m) => m.id === selectedModuleId)
    : null;
  const editorContent = selectedModuleId ? (notes[selectedModuleId] ?? '') : '';

  return (
    <div className="space-y-10">
      <p className="text-[#e8e8f0]/80 text-center max-w-2xl mx-auto leading-relaxed">
        Notes tied to each Spiral module. Auto-saved as you type. View and edit what you wrote in the lessons.
      </p>

      {/* Editor — distinct, above modules, not a module card */}
      <div className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-[#2d1b4e] to-[#1a0b2e] p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <PenLine className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-[#e8e8f0]">Edit notes</h3>
          {selectedModule && (
            <span className="text-[#e8e8f0]/60 text-sm ml-2">
              — {selectedModule.title}
            </span>
          )}
        </div>
        <p className="text-[#e8e8f0]/50 text-sm mb-4">
          Select a module below to load its notes. Or add notes here — they sync with the lesson.
        </p>
        <textarea
          value={editorContent}
          onChange={(e) =>
            selectedModuleId && handleChange(selectedModuleId, e.target.value)
          }
          placeholder={
            selectedModule
              ? 'Your notes for this module...'
              : 'Select a module below to get started'
          }
          disabled={!selectedModuleId}
          className="w-full min-h-[160px] bg-[#1a0b2e]/60 text-[#e8e8f0] rounded-xl p-4 border border-purple-500/20 focus:border-amber-500/40 focus:outline-none resize-y text-sm"
        />
        <p className="text-xs text-[#e8e8f0]/40 mt-2">Auto-saved</p>
      </div>

      {/* Module selector — click to load into editor */}
      <p className="text-[#e8e8f0]/60 text-sm text-center">
        Click a module to view and edit its notes
      </p>

      {([1, 2, 3] as const).map((tier) => (
        <div key={tier}>
          <h3 className="text-xl font-bold text-[#d4af37] mb-4 pb-2 border-b border-purple-500/20">
            {TIER_NAMES[tier]}
          </h3>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {(byTier[tier] ?? []).map((module) => {
              const isSelected = selectedModuleId === module.id;
              const hasNotes = Boolean(notes[module.id]?.trim());

              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => setSelectedModuleId(module.id)}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : 'border-purple-500/20 bg-gradient-to-br from-[#2d1b4e] to-[#1a0b2e] hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-[#e8e8f0]">{module.title}</h4>
                      <p className="text-sm text-[#e8e8f0]/60 mt-0.5">{module.subtitle}</p>
                    </div>
                    {hasNotes && (
                      <span className="text-xs text-amber-400/80">●</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
