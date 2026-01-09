import React, { useState } from 'react';

export default function FloatingActionButton() {
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [quickNote, setQuickNote] = useState('');

  const handleQuickSave = () => {
    if (quickNote.trim()) {
      // In production, this would save to the vault
      alert('Quick note saved to Vault!');
      setQuickNote('');
      setShowQuickEntry(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowQuickEntry(true)}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-full shadow-2xl shadow-purple-500/50 hover:scale-110 transition-transform flex items-center justify-center text-2xl"
      >
        ✍️
      </button>

      {showQuickEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a0b2e]/95 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-[#2d1b4e] to-[#1a0b2e] rounded-2xl max-w-md w-full p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold text-[#e8e8f0] mb-4">Quick Vault Entry</h3>
            <textarea
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder="Capture a quick thought..."
              className="w-full h-32 bg-[#1a0b2e]/50 text-[#e8e8f0] rounded-lg p-4 border border-purple-500/20 focus:border-purple-500/40 focus:outline-none resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowQuickEntry(false)}
                className="flex-1 py-2 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickSave}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
