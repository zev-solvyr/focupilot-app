import React, { useState } from 'react';
import { Plus, Target, Check, Trash2, Sparkles, X, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Goal } from '../types';
import { sound } from '../services/sound';
import { aiService } from '../services/ai';

interface GoalsViewProps {
  goals: Goal[];
  onOpenAddGoal: () => void;
  onUpdateGoal: (updatedGoal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  onOpenAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleToggleMilestone = (goal: Goal, milestoneId: string) => {
    const updatedMilestones = goal.milestones.map((m) => {
      if (m.id === milestoneId) {
        const nextState = !m.completed;
        if (nextState) {
          sound.playCompletionChime();
          confetti({
            particleCount: 40,
            spread: 70,
            origin: { y: 0.7 },
            colors: ['#ffffff', '#e4e4e7', '#a1a1aa'],
          });
        }
        return { ...m, completed: nextState };
      }
      return m;
    });

    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progress = Math.round((completedCount / (updatedMilestones.length || 1)) * 100);

    const updatedGoal = {
      ...goal,
      milestones: updatedMilestones,
      progress,
    };

    onUpdateGoal(updatedGoal);
    setSelectedGoal(updatedGoal);
  };

  const handleAIMilestones = async (goal: Goal) => {
    setIsGeneratingAI(true);
    try {
      const generated = await aiService.breakdownGoal(goal.title, goal.category, goal.description);
      const updated = {
        ...goal,
        milestones: [...goal.milestones, ...generated],
      };
      onUpdateGoal(updated);
      setSelectedGoal(updated);
      sound.playCompletionChime();
    } catch {
      // handled
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-xl mx-auto px-2 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">
            Strategic Goals
          </h2>
          <p className="text-xs text-zinc-500">Tap any goal card to inspect milestones and action items.</p>
        </div>
        <button
          onClick={onOpenAddGoal}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          New Goal
        </button>
      </div>

      {/* Square Tile Grid */}
      {goals.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl border border-dashed border-zinc-900">
          <Target className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">No active goals yet.</p>
          <button
            onClick={onOpenAddGoal}
            className="mt-2 text-xs text-white font-semibold underline underline-offset-4 hover:text-zinc-300"
          >
            + Create your first strategic goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {goals.map((goal) => {
            const completedCount = goal.milestones.filter((m) => m.completed).length;

            return (
              <div
                key={goal.id}
                onClick={() => setSelectedGoal(goal)}
                className="aspect-square glass-panel rounded-3xl p-4 sm:p-5 border border-zinc-900 hover:border-zinc-700 cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Top: Pillar & Deadline */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      {goal.category}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono">
                      {goal.targetDate?.slice(5) || 'Ongoing'}
                    </span>
                  </div>

                  {/* Goal Title */}
                  <h3 className="text-sm font-bold text-white group-hover:text-zinc-200 line-clamp-3 leading-snug">
                    {goal.title}
                  </h3>
                </div>

                {/* Bottom: Progress Ring and Milestone Count */}
                <div className="pt-2 border-t border-zinc-900 flex items-end justify-between">
                  <div className="space-y-0.5">
                    <span className="text-lg font-extrabold text-white font-mono-numbers block leading-none">
                      {goal.progress}%
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono">
                      {completedCount}/{goal.milestones.length} done
                    </span>
                  </div>

                  {/* Mini Visual Gauge */}
                  <div className="w-8 h-8 relative flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-zinc-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-white transition-all duration-500"
                        strokeDasharray={`${goal.progress}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded Goal Modal / Detail View */}
      {selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-black rounded-3xl p-6 border border-zinc-800 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
            {/* Close Button */}
            <button
              onClick={() => setSelectedGoal(null)}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white rounded-full bg-zinc-950 border border-zinc-900"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800">
                  {selectedGoal.category}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Deadline: {selectedGoal.targetDate}
                </span>
              </div>
              <h2 className="text-base font-bold text-white leading-snug">
                {selectedGoal.title}
              </h2>
              {selectedGoal.description && (
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  {selectedGoal.description}
                </p>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-400 font-mono">
                <span>Progress</span>
                <span className="font-bold text-white">{selectedGoal.progress}%</span>
              </div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-300"
                  style={{ width: `${selectedGoal.progress}%` }}
                />
              </div>
            </div>

            {/* Milestones Checklist */}
            <div className="space-y-2 pt-2 border-t border-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Milestones ({selectedGoal.milestones.filter((m) => m.completed).length}/{selectedGoal.milestones.length})
                </span>

                <button
                  type="button"
                  onClick={() => handleAIMilestones(selectedGoal)}
                  disabled={isGeneratingAI}
                  className="flex items-center gap-1 text-[11px] text-white hover:text-zinc-300 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 transition-colors"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Expanding...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      AI Expand
                    </>
                  )}
                </button>
              </div>

              {selectedGoal.milestones.length === 0 ? (
                <p className="text-xs text-zinc-600 py-3 text-center">No milestones yet. Tap AI Expand to create some.</p>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {selectedGoal.milestones.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleToggleMilestone(selectedGoal, m.id)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 cursor-pointer transition-colors border border-zinc-900/60"
                    >
                      <button
                        type="button"
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                          m.completed ? 'bg-white border-white text-black' : 'border-zinc-700 bg-black'
                        }`}
                      >
                        {m.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <span
                        className={`text-xs flex-1 ${
                          m.completed ? 'line-through text-zinc-500' : 'text-zinc-200'
                        }`}
                      >
                        {m.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-zinc-900 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this goal and its milestones?')) {
                    onDeleteGoal(selectedGoal.id);
                    setSelectedGoal(null);
                  }
                }}
                className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Goal
              </button>

              <button
                type="button"
                onClick={() => setSelectedGoal(null)}
                className="px-4 py-1.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
