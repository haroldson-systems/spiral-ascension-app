import React, { useState } from 'react';

export interface JournalEntry {
  id: string;
  content: string;
  tags: string[];
  timestamp: Date;
  type: 'text' | 'voice';
}

interface VaultEntryProps {
  onSave: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
}

export default function VaultEntry({ onSave }: VaultEntryProps) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleAddTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    if (content.trim()) {
      onSave({
        content,
        tags,
        type: 'text'
      });
      setContent('');
      setTags([]);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In production, this would handle actual voice recording
  };

  return (
    <div className="bg-gradient-to-br from-[#2d1b4e] to-[#1a0b2e] rounded-xl p-6 shadow-xl border border-purple-500/20">
      <h3 className="text-2xl font-bold text-[#e8e8f0] mb-4">New Entry</h3>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What are you remembering today?"
        className="w-full h-40 bg-[#1a0b2e]/50 text-[#e8e8f0] rounded-lg p-4 border border-purple-500/20 focus:border-purple-500/40 focus:outline-none resize-none mb-4"
      />

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={currentTag}
          onChange={(e) => setCurrentTag(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
          placeholder="Add tag (step, moon phase, etc.)"
          className="flex-1 bg-[#1a0b2e]/50 text-[#e8e8f0] rounded-lg px-4 py-2 border border-purple-500/20 focus:border-purple-500/40 focus:outline-none text-sm"
        />
        <button
          onClick={handleAddTag}
          className="px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-all"
        >
          Add
        </button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map(tag => (
            <span
              key={tag}
              className="px-3 py-1 bg-[#d4af37]/20 text-[#d4af37] rounded-full text-sm flex items-center gap-2"
            >
              {tag}
              <button onClick={() => handleRemoveTag(tag)} className="hover:text-[#d4af37]/70">×</button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={toggleRecording}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            isRecording 
              ? 'bg-red-600 text-white' 
              : 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30'
          }`}
        >
          {isRecording ? '⏹ Stop Recording' : '🎤 Voice Entry'}
        </button>
        
        <button
          onClick={handleSave}
          disabled={!content.trim()}
          className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Save to Vault
        </button>
      </div>
    </div>
  );
}
