import React, { useState } from 'react';
import { X, Sparkles, SunMedium, Compass } from 'lucide-react';
import { DailyCheckIn } from '../types';

interface MorningCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (checkIn: DailyCheckIn) => void;
  existingCheckIn?: DailyCheckIn | null;
}

export const MorningCheckInModal: React.FC<MorningCheckInModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingCheckIn,
}) => {
  const [energy, setEnergy] = useState<number>(existingCheckIn?.energyLevel || 4);
  const [focusIntent, setFocusIntent] = useState<string>(
    existingCheckIn?.focusIntent || ''
  );
  const [mood, setMood] = useState<string>(existingCheckIn?.mood || 'Sharp');

  if (!isOpen) return null;

  const moods = ['Sharp', 'Calm', 'Focused', 'Fatigued', 'Overwhelmed'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split('T')[0];
    onSave({
      date: todayStr,
      energyLevel: energy,
      focusIntent: focusIntent.trim() || 'Execute highest leverage priorities with zero distraction.',
      mood,
      completed: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-black rounded-3xl p-6 border border-zinc-800 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white rounded-full bg-zinc-950 border border-zinc-900"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
            <SunMedium className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Morning Command Read
              <Sparkles className="w-4 h-4 text-white" />
            </h2>
            <p className="text-xs text-zinc-400">Calibrate capacity & lock today's primary needle-mover.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Energy Rating 1-5 */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-2">
              Cognitive Energy (1 - 5)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setEnergy(lvl)}
                  className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                    energy === lvl
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Headspace */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-2">
              Headspace
            </label>
            <div className="flex flex-wrap gap-2">
              {moods.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    mood === m
                      ? 'bg-white text-black border-white font-bold'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Daily Intention */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
              The #1 Needle Mover
            </label>
            <div className="relative">
              <Compass className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
              <input
                type="text"
                value={focusIntent}
                onChange={(e) => setFocusIntent(e.target.value)}
                placeholder="e.g. Ship core module before checking notifications"
                className="w-full pl-9 pr-3 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-2 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors shadow-sm"
          >
            Lock In Today's Focus
          </button>
        </form>
      </div>
    </div>
  );
};
