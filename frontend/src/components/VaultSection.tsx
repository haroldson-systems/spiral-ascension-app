import React, { useState, useEffect, useCallback } from 'react';
import VaultEntry, { JournalEntry } from './VaultEntry';
import SpiralNotesView from './SpiralNotesView';
import { fetchVaultEntries, createVaultEntry } from '@/lib/vaultApi';

type VaultMode = 'spiral' | 'personal';

const VAULT_MODE_KEY = 'spiral-ascension-vault-mode';

function getStoredMode(): VaultMode {
  try {
    const s = localStorage.getItem(VAULT_MODE_KEY);
    if (s === 'spiral' || s === 'personal') return s;
  } catch {
    /* Ignore unavailable localStorage. */
  }
  return 'personal';
}

interface VaultSectionProps {
  initialMode?: VaultMode;
  /** Called after the user toggles the mode (e.g. to keep the URL in sync). */
  onModeChange?: (mode: VaultMode) => void;
}

export default function VaultSection({ initialMode, onModeChange }: VaultSectionProps) {
  const [mode, setMode] = useState<VaultMode>(() =>
    initialMode ?? getStoredMode()
  );

  // Apply the URL-provided mode only when the URL value itself changes.
  // Depending on `mode` here re-ran the effect after every user toggle and
  // forced the view straight back to `initialMode` (the "flicker" bug).
  useEffect(() => {
    if (!initialMode) return;
    setMode(initialMode);
    try {
      localStorage.setItem(VAULT_MODE_KEY, initialMode);
    } catch {
      /* Ignore unavailable localStorage. */
    }
  }, [initialMode]);

  const setModeAndStore = (m: VaultMode) => {
    setMode(m);
    try {
      localStorage.setItem(VAULT_MODE_KEY, m);
    } catch {
      /* Ignore unavailable localStorage. */
    }
    onModeChange?.(m);
  };
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesError, setEntriesError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setEntriesLoading(true);
    setEntriesError(null);
    try {
      const data = await fetchVaultEntries();
      setEntries(
        data.map((e) => ({
          id: e.id,
          content: e.content,
          tags: Array.isArray(e.tags) ? e.tags : [],
          timestamp: new Date(e.created_at),
          type: (e.type as 'text' | 'voice') || 'text',
        }))
      );
    } catch (err) {
      // Do not pretend the vault is empty when the request failed.
      setEntries([]);
      setEntriesError(err instanceof Error && err.message ? err.message : 'Unknown error');
    } finally {
      setEntriesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'personal') loadEntries();
  }, [mode, loadEntries]);

  const handleSaveEntry = async (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => {
    // Errors propagate to VaultEntry, which keeps the editor content and shows them.
    const created = await createVaultEntry({
      content: entry.content,
      tags: entry.tags,
      type: entry.type,
    });
    setEntries((prev) => [
      {
        id: created.id,
        content: created.content,
        tags: Array.isArray(created.tags) ? created.tags : [],
        timestamp: new Date(created.created_at),
        type: (created.type as 'text' | 'voice') || 'text',
      },
      ...prev,
    ]);
  };

  const handleExport = () => {
    const exportData = JSON.stringify(entries, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vault-export-${Date.now()}.json`;
    a.click();
  };

  const filteredEntries = entries.filter(entry =>
    entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <section id="vault-section" className="pt-20 pb-28 px-4 bg-gradient-to-b from-[#2d1b4e] to-[#1a0b2e]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-amber-400/90 text-sm uppercase tracking-widest mb-3">You&apos;re here</p>
          <h2 className="text-5xl font-bold text-[#e8e8f0] mb-4">The Vault</h2>
          <p className="text-xl text-[#e8e8f0]/80 max-w-2xl mx-auto mb-6 leading-relaxed">
            Your inner sanctuary — a safe place to breathe, reflect, and integrate. No judgment. No rush.
          </p>
          {/* Toggle: Spiral Notes | Personal Writings */}
          <div className="inline-flex rounded-lg border border-purple-500/30 bg-[#2d1b4e]/50 p-1">
            <button
              type="button"
              onClick={() => setModeAndStore('spiral')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'spiral'
                  ? 'bg-purple-600 text-white'
                  : 'text-[#e8e8f0]/70 hover:text-[#e8e8f0]'
              }`}
            >
              Spiral Notes
            </button>
            <button
              type="button"
              onClick={() => setModeAndStore('personal')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'personal'
                  ? 'bg-purple-600 text-white'
                  : 'text-[#e8e8f0]/70 hover:text-[#e8e8f0]'
              }`}
            >
              Personal Writings
            </button>
          </div>
        </div>

        {mode === 'spiral' ? (
          <SpiralNotesView />
        ) : (
          <>
        <VaultEntry onSave={handleSaveEntry} />

        <div className="mt-12">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search entries by content or tags..."
              className="flex-1 bg-[#2d1b4e] text-[#e8e8f0] rounded-lg px-4 py-3 border border-purple-500/20 focus:border-purple-500/40 focus:outline-none"
            />
            <button
              onClick={handleExport}
              disabled={entries.length === 0}
              className="px-6 py-3 bg-[#d4af37]/20 text-[#d4af37] rounded-lg font-semibold hover:bg-[#d4af37]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Export Vault
            </button>
          </div>

          <div className="space-y-4">
            {entriesLoading ? (
              <div className="text-center py-12 text-[#e8e8f0]/50">Loading...</div>
            ) : entriesError ? (
              <div
                role="alert"
                data-testid="vault-load-error"
                className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-6 text-center text-sm text-red-200"
              >
                <p className="font-semibold">Could not load your vault.</p>
                <p className="mt-1 break-words text-red-200/80">{entriesError}</p>
                <button
                  onClick={() => loadEntries()}
                  className="mt-3 px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-all"
                >
                  Retry
                </button>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-12 text-[#e8e8f0]/50">
                {entries.length === 0 ? 'Your vault is empty. Begin your journey above.' : 'No entries match your search.'}
              </div>
            ) : (
              filteredEntries.map(entry => (
                <div key={entry.id} className="bg-gradient-to-br from-[#2d1b4e] to-[#1a0b2e] rounded-xl p-6 border border-purple-500/20">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[#e8e8f0]/60 text-sm">
                      {entry.timestamp.toLocaleDateString()} at {entry.timestamp.toLocaleTimeString()}
                    </span>
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-[#d4af37]/20 text-[#d4af37] rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-[#e8e8f0] leading-relaxed">{entry.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </section>
  );
}
