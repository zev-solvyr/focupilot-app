import React, { useState } from 'react';
import { Mic, MicOff, Plus, Trash2 } from 'lucide-react';
import { JournalEntry } from '../types';
import { sound } from '../services/sound';

interface JournalViewProps {
  entries: JournalEntry[];
  onAddEntry: (entry: JournalEntry) => void;
  onDeleteEntry?: (id: string) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({ entries, onAddEntry, onDeleteEntry }) => {
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech-to-text is not supported in this browser. Try Chrome on Android or Desktop.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsRecording(true);
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech error:', e);
      setIsRecording(false);
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim()) return;

    const newEntry: JournalEntry = {
      id: `note_${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      content: content.trim(),
      mood: 'focused', // default legacy field
    };

    onAddEntry(newEntry);
    setContent('');
    sound.playCompletionChime();
  };

  return (
    <div className="space-y-4 pb-24 max-w-xl mx-auto px-2 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">
            Daily Notes
          </h2>
          <p className="text-xs text-zinc-500">Capture ideas, logs, and thoughts in real time.</p>
        </div>
        <span className="text-xs font-mono text-zinc-500">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* Simple Keep-Style Note Creator Box */}
      <div className="glass-panel rounded-3xl p-4 border border-zinc-900 focus-within:border-zinc-700 transition-colors">
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Take a note or write a reflection..."
          className="w-full bg-transparent text-xs text-white placeholder-zinc-600 focus:outline-none resize-none leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSave();
            }
          }}
        />

        <div className="flex items-center justify-between pt-2 border-t border-zinc-900/60 mt-2">
          {/* Voice to text dictation toggle */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`p-2 rounded-xl text-xs flex items-center gap-1.5 transition-all ${
              isRecording
                ? 'bg-white text-black animate-pulse'
                : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
            }`}
            title="Speech-to-text Voice Dictation"
          >
            {isRecording ? <Mic className="w-4 h-4 text-black" /> : <MicOff className="w-4 h-4" />}
            <span className="text-[11px] font-medium">{isRecording ? 'Listening...' : 'Dictate'}</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={!content.trim()}
            className="px-3.5 py-1.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 disabled:opacity-20 transition-all flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Keep Note
          </button>
        </div>
      </div>

      {/* Keep-Style Notes Grid */}
      <div className="space-y-2 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 px-1">
          Saved Notes ({entries.length})
        </h3>

        {entries.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-2xl border border-dashed border-zinc-900">
            <p className="text-xs text-zinc-500">No notes saved yet.</p>
            <p className="text-[11px] text-zinc-600 mt-1">Jot down your first idea or observation above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="glass-panel rounded-2xl p-4 border border-zinc-900 hover:border-zinc-800 transition-all flex flex-col justify-between group"
              >
                <p className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {entry.content}
                </p>

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-900/60 text-[10px] text-zinc-500 font-mono">
                  <span>
                    {entry.date} {entry.timestamp ? `• ${entry.timestamp}` : ''}
                  </span>
                  {onDeleteEntry && (
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-white transition-opacity p-0.5"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
