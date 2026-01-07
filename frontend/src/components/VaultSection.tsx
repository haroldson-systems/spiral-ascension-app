import React, { useState } from 'react';
import VaultEntry, { JournalEntry } from './VaultEntry';

export default function VaultSection() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSaveEntry = (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setEntries([newEntry, ...entries]);
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
    <section id="vault-section" className="py-20 px-4 bg-gradient-to-b from-[#2d1b4e] to-[#1a0b2e]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-[#e8e8f0] mb-4">The Vault</h2>
          <p className="text-xl text-[#e8e8f0]/70 max-w-2xl mx-auto mb-6">
            Your private sanctuary for reflection and integration. Write, voice record, tag by moon phase or Spiral step.
          </p>
          <p className="text-[#d4af37] font-semibold">Always free. Always yours. Export anytime.</p>
        </div>

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
            {filteredEntries.length === 0 ? (
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
                  <p className="text-[#e8e8f0] leading-relaxed">{entry.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
