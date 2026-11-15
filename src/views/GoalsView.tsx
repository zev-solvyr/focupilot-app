import React from 'react';
import { Plus, Target, Check, Trash2, Sparkles, X, ChevronLeft, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Goal } from '../types';
import { sound } from '../services/sound';
import { aiService } from '../services/ai';

interface GoalsViewProps {
  goals: Goal[];
  selectedGoal: Goal | null;
  onSelectGoal: (goal: Goal | null) => void;
  onOpenAddGoal: () => void;
  onUpdateGoal: (updatedGoal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  selectedGoal,
  onSelectGoal,
  onOpenAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const [isGeneratingAI, setIsGeneratingAI] = React.useState(false);

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
    onSelectGoal(updatedGoal);
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
      onSelectGoal(updated);
      sound.playCompletionChime();
    } catch {
      // handled
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 max-w-xl mx-auto px-2 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Strategic Goals
          </h2>
          <p className="text-xs text-zinc-500">Tap any goal card to view and manage milestones.</p>
        </div>
        <button
          onClick={onOpenAddGoal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all active:scale-95 shadow-[0_4px_15px_rgba(255,255,255,0.15)]"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          New Goal
        </button>
      </div>

      {/* Square Tile Grid */}
      {goals.length === 0 ? (
        <div className="text-center py-16 ios-matte-panel rounded-3xl border border-dashed border-white/10">
          <Target className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-400">No active goals yet.</p>
          <button
            onClick={onOpenAddGoal}
            className="mt-2 text-xs text-white font-semibold underline underline-offset-4 hover:text-zinc-300"
          >
            + Create your first goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {goals.map((goal) => {
            const completedCount = goal.milestones.filter((m) => m.completed).length;

            return (
              <div
                key={goal.id}
                onClick={() => onSelectGoal(goal)}
                className="aspect-square ios-matte-card rounded-3xl p-4 sm:p-5 cursor-pointer flex flex-col justify-between group relative overflow-hidden active:scale-[0.98]"
              >
                {/* Top: Deadline Only (No Categories) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-zinc-500 font-mono tracking-tight">
                      {goal.targetDate ? `Due ${goal.targetDate.slice(5)}` : 'Ongoing'}
                    </span>
                  </div>

                  {/* Goal Title */}
                  <h3 className="text-sm font-bold text-white group-hover:text-zinc-200 line-clamp-3 leading-snug">
                    {goal.title}
                  </h3>
                </div>

                {/* Bottom: Progress Ring and Milestone Count */}
                <div className="pt-2 border-t border-white/10 flex items-end justify-between">
                  <div className="space-y-0.5">
                    <span className="text-lg font-extrabold text-white font-mono-numbers block leading-none">
                      {goal.progress}%
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {completedCount}/{goal.milestones.length} done
                    </span>
                  </div>

                  {/* Mini iOS Circular Progress Gauge */}
                  <div className="w-8 h-8 relative flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-white/10"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="relative w-full max-w-md ios-matte-sheet rounded-3xl p-6 shadow-2xl max-h-[88vh] overflow-y-auto space-y-4">
            {/* Top iOS Header with Back Navigation & Close */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <button
                onClick={() => onSelectGoal(null)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Goals</span>
              </button>

              <button
                onClick={() => onSelectGoal(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Goal Info (No category pill) */}
            <div>
              {selectedGoal.targetDate && (
                <span className="text-[10px] text-zinc-500 font-mono block mb-1">
                  Target Deadline: {selectedGoal.targetDate}
                </span>
              )}
              <h2 className="text-base font-bold text-white leading-snug">
                {selectedGoal.title}
              </h2>
              {selectedGoal.description && selectedGoal.description !== 'No description provided.' && (
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  {selectedGoal.description}
                </p>
              )}
            </div>

            {/* Progress Gauge */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Completion</span>
                <span className="text-white font-mono font-bold">{selectedGoal.progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300 rounded-full"
                  style={{ width: `${selectedGoal.progress}%` }}
                />
              </div>
            </div>

            {/* Milestones Action Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">Milestones & Action Items</label>
                <button
                  type="button"
                  onClick={() => handleAIMilestones(selectedGoal)}
                  disabled={isGeneratingAI}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-all disabled:opacity-40"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-white" />
                      AI Expand
                    </>
                  )}
                </button>
              </div>

              {selectedGoal.milestones.length === 0 ? (
                <p className="text-[11px] text-zinc-500 py-3 text-center">No milestones added yet.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedGoal.milestones.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleToggleMilestone(selectedGoal, m.id)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        m.completed
                          ? 'bg-black/50 border-white/5 opacity-50'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <button
                        type="button"
                        className={`w-4 h-4 rounded-md flex items-center justify-center border mt-0.5 shrink-0 transition-all ${
                          m.completed
                            ? 'bg-white border-white text-black'
                            : 'border-white/30 bg-transparent'
                        }`}
                      >
                        {m.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <p
                        className={`text-xs leading-snug flex-1 ${
                          m.completed ? 'line-through text-zinc-500' : 'text-zinc-200'
                        }`}
                      >
                        {m.title}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions footer */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this goal and all its milestones?')) {
                    onDeleteGoal(selectedGoal.id);
                    onSelectGoal(null);
                  }
                }}
                className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Goal
              </button>

              <button
                type="button"
                onClick={() => onSelectGoal(null)}
                className="px-4 py-1.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};