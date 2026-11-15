import React from 'react';
import { Task, FocusSession } from '../types';

interface AnalyticsViewProps {
  score: number;
  tasks: Task[];
  sessions: FocusSession[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ score, tasks, sessions }) => {
  const totalFocusMinutes = sessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Real 7-day circular activity data from user sessions
  const now = new Date();
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - i));
    const isoDate = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' }); // M, T, W...
    const fullDay = d.toLocaleDateString('en-US', { weekday: 'short' });

    const minutes = sessions
      .filter((s) => s.timestamp.startsWith(isoDate))
      .reduce((sum, s) => sum + s.durationMinutes, 0);

    return {
      letter: dayName,
      fullDay,
      date: isoDate,
      minutes,
      active: minutes > 0,
      isToday: i === 6,
    };
  });

  const activeDaysCount = weekDays.filter((d) => d.active).length;
  const weeklyTargetMinutes = 600; // 10 hours goal
  const deepWorkPct = Math.min(100, Math.round((totalFocusMinutes / weeklyTargetMinutes) * 100));

  // Category distribution
  const categoryMinutes: Record<string, number> = {};
  sessions.forEach((s) => {
    categoryMinutes[s.category] = (categoryMinutes[s.category] || 0) + s.durationMinutes;
  });

  // Circular gauge helper
  const renderCircle = (
    value: number,
    size: number = 72,
    stroke: number = 6,
    label?: string,
    sublabel?: string
  ) => {
    const radius = size / 2;
    const normRadius = radius - stroke;
    const circumference = normRadius * 2 * Math.PI;
    const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg height={size} width={size} className="transform -rotate-90">
            <circle
              stroke="#1f1f1f"
              fill="transparent"
              strokeWidth={stroke}
              r={normRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke="#ffffff"
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.8s ease' }}
              strokeLinecap="round"
              r={normRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          <span className="absolute text-xs font-bold font-mono-numbers text-white">
            {value}%
          </span>
        </div>
        {label && <span className="text-xs font-bold text-white mt-1.5">{label}</span>}
        {sublabel && <span className="text-[10px] text-zinc-500 font-mono">{sublabel}</span>}
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-24 max-w-xl mx-auto px-2 sm:px-0">
      {/* Title */}
      <div>
        <h2 className="text-base font-bold text-white tracking-wide">
          Performance Analytics
        </h2>
        <p className="text-xs text-zinc-500">Circular telemetry of your daily and weekly output.</p>
      </div>

      {/* 1. Giant Central Orbit Gauge */}
      <div className="glass-panel rounded-3xl p-6 border border-zinc-900 flex flex-col items-center text-center relative overflow-hidden">
        <div className="relative flex items-center justify-center my-3">
          <svg height="170" width="170" className="transform -rotate-90">
            {/* Outer track */}
            <circle
              stroke="#171717"
              fill="transparent"
              strokeWidth="10"
              r="70"
              cx="85"
              cy="85"
            />
            {/* Active progress */}
            <circle
              stroke="#ffffff"
              fill="transparent"
              strokeWidth="10"
              strokeDasharray={`${70 * 2 * Math.PI} ${70 * 2 * Math.PI}`}
              style={{
                strokeDashoffset: (70 * 2 * Math.PI) - (score / 100) * (70 * 2 * Math.PI),
                transition: 'stroke-dashoffset 0.8s ease'
              }}
              strokeLinecap="round"
              r="70"
              cx="85"
              cy="85"
            />
            {/* Inner secondary ring for tasks */}
            <circle
              stroke="#262626"
              fill="transparent"
              strokeWidth="4"
              r="54"
              cx="85"
              cy="85"
            />
            <circle
              stroke="#a1a1aa"
              fill="transparent"
              strokeWidth="4"
              strokeDasharray={`${54 * 2 * Math.PI} ${54 * 2 * Math.PI}`}
              style={{
                strokeDashoffset: (54 * 2 * Math.PI) - (taskCompletionRate / 100) * (54 * 2 * Math.PI),
                transition: 'stroke-dashoffset 0.8s ease'
              }}
              strokeLinecap="round"
              r="54"
              cx="85"
              cy="85"
            />
          </svg>

          {/* Center Score */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold tracking-tight font-mono-numbers text-white">
              {score}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-0.5">
              Focus Index
            </span>
          </div>
        </div>

        {/* Status pill */}
        <span className="text-xs px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium">
          {score >= 80 ? 'Peak Flow' : score >= 50 ? 'Steady Cadence' : 'Calibrating'}
        </span>
      </div>

      {/* 2. Trio of Circular Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-panel rounded-2xl p-3.5 border border-zinc-900 flex flex-col items-center justify-center">
          {renderCircle(taskCompletionRate, 64, 5, 'Tasks', `${completedTasks}/${tasks.length}`)}
        </div>

        <div className="glass-panel rounded-2xl p-3.5 border border-zinc-900 flex flex-col items-center justify-center">
          {renderCircle(deepWorkPct, 64, 5, 'Deep Work', `${totalFocusHours}h / 10h`)}
        </div>

        <div className="glass-panel rounded-2xl p-3.5 border border-zinc-900 flex flex-col items-center justify-center">
          {renderCircle(Math.round((activeDaysCount / 7) * 100), 64, 5, 'Streak', `${activeDaysCount}/7 days`)}
        </div>
      </div>

      {/* 3. Circular 7-Day Orbit Matrix (Circles, Not Bars) */}
      <div className="glass-panel rounded-3xl p-5 border border-zinc-900 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            7-Day Activity Matrix
          </h3>
          <span className="text-xs text-zinc-500 font-mono">
            {activeDaysCount} of 7 active
          </span>
        </div>

        {/* 7 Circle Nodes */}
        <div className="flex items-center justify-between pt-2 px-1">
          {weekDays.map((d) => (
            <div key={d.date} className="flex flex-col items-center gap-2">
              {/* Circular Node */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                  d.isToday
                    ? 'border-white bg-white text-black font-extrabold shadow-[0_0_10px_rgba(255,255,255,0.4)]'
                    : d.active
                    ? 'border-zinc-500 bg-zinc-900 text-white font-bold'
                    : 'border-zinc-900 bg-black text-zinc-600'
                }`}
              >
                <span className="text-xs font-mono">{d.letter}</span>
              </div>

              {/* Minutes under each circle */}
              <span className={`text-[10px] font-mono ${d.active ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {d.minutes > 0 ? `${d.minutes}m` : '-'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Attention Allocation Donut / Circular Breakdown */}
      {totalFocusMinutes > 0 ? (
        <div className="glass-panel rounded-3xl p-5 border border-zinc-900 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Time Allocation
          </h3>

          <div className="space-y-2 pt-1">
            {Object.entries(categoryMinutes).map(([cat, mins]) => {
              const pct = Math.round((mins / totalFocusMinutes) * 100);
              return (
                <div key={cat} className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-900/60">
                  <div className="flex items-center gap-2.5">
                    {/* Mini circular indicator */}
                    <div className="w-5 h-5 rounded-full border border-zinc-700 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <span className="text-xs text-zinc-300 capitalize font-medium">{cat}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-white font-bold">{mins}m</span>
                    <span className="text-zinc-600">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl glass-panel text-center text-xs text-zinc-600">
          No focus sessions logged yet. Complete a session in the <strong>Focus</strong> tab to generate your telemetry circles.
        </div>
      )}
    </div>
  );
};
