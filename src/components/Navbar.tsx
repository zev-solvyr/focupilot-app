import React from 'react';
import { Settings, Sparkles } from 'lucide-react';
import { UserSettings } from '../types';

interface NavbarProps {
  settings: UserSettings;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ settings, onOpenSettings }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-black/75 backdrop-blur-2xl border-b border-white/10 px-4 py-3 sm:px-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-white text-black font-extrabold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 fill-black text-black" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white tracking-wide">
              {getGreeting()}{settings.userName ? `, ${settings.userName}` : ''}
            </h1>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all active:scale-95"
          title="Settings & AI"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};