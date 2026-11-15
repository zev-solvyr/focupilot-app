import React from 'react';
import { CheckCircle2, Clock, Brain } from 'lucide-react';

interface FocusScoreRingProps {
  score: number; // 0 to 100
  tasksRatio: number;
  deepWorkRatio: number;
  checkInDone: boolean;
  todayFocusMinutes: number;
  targetMinutes: number;
}

export const FocusScoreRing: React.FC<FocusScoreRingProps> = ({
  score,
  tasksRatio,
  checkInDone,
  todayFocusMinutes,
  targetMinutes,
}) => {
  const radius = 68;
  const stroke = 9;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreStatusText = () => {
    if (score >= 85) return 'Peak Focus';
    if (score >= 70) return 'High Velocity';
    if (score >= 45) return 'In Progress';
    return 'Calibrating';
  };

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 relative overflow-hidden">
      <div className="flex flex-col items-center text-center">
        {/* Radial SVG Dial - Black & White Monochrome */}
        <div className="relative flex items-center justify-center my-2">
          <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
            {/* Background ring */}
            <circle
              stroke="#1f1f1f"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Active progress ring - Pure White */}
            <circle
              stroke="#ffffff"
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-extrabold tracking-tight font-mono-numbers text-white">
              {score}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-0.5">
              Focus Score
            </span>
          </div>
        </div>

        {/* State Label */}
        <div className="mt-1">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
            {getScoreStatusText()}
          </span>
        </div>

        {/* Breakdown 3-Column Metrics */}
        <div className="grid grid-cols-3 gap-2 w-full mt-5 pt-4 border-t border-zinc-900 text-center">
          {/* Tasks */}
          <div className="flex flex-col items-center p-2 rounded-xl bg-zinc-950 border border-zinc-900/60">
            <div className="flex items-center gap-1 text-[11px] text-zinc-400 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span>Tasks</span>
            </div>
            <span className="text-sm font-bold text-white font-mono-numbers">{tasksRatio}%</span>
            <span className="text-[10px] text-zinc-500">done</span>
          </div>

          {/* Deep Work */}
          <div className="flex flex-col items-center p-2 rounded-xl bg-zinc-950 border border-zinc-900/60">
            <div className="flex items-center gap-1 text-[11px] text-zinc-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-white" />
              <span>Deep Work</span>
            </div>
            <span className="text-sm font-bold text-white font-mono-numbers">{todayFocusMinutes}m</span>
            <span className="text-[10px] text-zinc-500">of {targetMinutes}m</span>
          </div>

          {/* Flow Pace */}
          <div className="flex flex-col items-center p-2 rounded-xl bg-zinc-950 border border-zinc-900/60">
            <div className="flex items-center gap-1 text-[11px] text-zinc-400 mb-1">
              <Brain className="w-3.5 h-3.5 text-white" />
              <span>Cadence</span>
            </div>
            <span className="text-sm font-bold text-white">
              {score >= 75 ? 'Flow' : score > 0 ? 'Building' : 'Priming'}
            </span>
            <span className="text-[10px] text-zinc-500">momentum</span>
          </div>
        </div>
      </div>
    </div>
  );
};
