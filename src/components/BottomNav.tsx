import React from 'react';
import { LayoutDashboard, Target, Bot, BookOpen } from 'lucide-react';

export type TabType = 'today' | 'goals' | 'journal' | 'mentor';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'today' as TabType, label: 'Today', icon: LayoutDashboard },
    { id: 'goals' as TabType, label: 'Goals', icon: Target },
    { id: 'journal' as TabType, label: 'Notes', icon: BookOpen },
    { id: 'mentor' as TabType, label: 'Mentor', icon: Bot },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-2xl border-t border-white/10 px-4 py-2 sm:py-2.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-white font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-6 h-[2.5px] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
              )}
              <Icon className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${isActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.6]'}`} />
              <span className="text-[11px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};