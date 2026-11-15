import React, { useState } from 'react';
import { X, Sparkles, Target, Trash2, Plus, Loader2, ChevronLeft } from 'lucide-react';
import { Goal, Milestone } from '../types';
import { aiService } from '../services/ai';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (goal: Goal) => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  if (!isOpen) return null;

  const handleAIBreakdown = async () => {
    if (!title.trim()) {
      alert('Please enter a goal title first so AI can break it down.');
      return;
    }
    setIsGeneratingAI(true);
    try {
      const generated = await aiService.breakdownGoal(title, 'career', description);
      setMilestones(generated);
    } catch {
      // fallback handled
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAddMilestone = () => {
    if (!newMilestoneText.trim()) return;
    setMilestones([
      ...milestones,
      { id: `m_${Date.now()}`, title: newMilestoneText.trim(), completed: false },
    ]);
    setNewMilestoneText('');
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newGoal: Goal = {
      id: `goal_${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'No description provided.',
      category: 'career',
      targetDate,
      progress: 0,
      milestones,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAdd(newGoal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-lg ios-matte-sheet rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* iOS Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Target className="w-4 h-4 text-white" />
            New Goal
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Goal Objective</label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master System Design, Launch MVP..."
              className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-white font-mono transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Context & Details (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What changes once this goal is achieved?"
              className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Actionable Milestones Breakdown */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">Actionable Milestones</label>
              <button
                type="button"
                onClick={handleAIBreakdown}
                disabled={isGeneratingAI}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all disabled:opacity-40"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    AI Auto-Breakdown
                  </>
                )}
              </button>
            </div>

            {milestones.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-200"
                  >
                    <span className="truncate pr-2">{m.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(m.id)}
                      className="text-zinc-500 hover:text-white p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newMilestoneText}
                onChange={(e) => setNewMilestoneText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMilestone();
                  }
                }}
                placeholder="Add milestone step..."
                className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white transition-colors"
              />
              <button
                type="button"
                onClick={handleAddMilestone}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 rounded-2xl bg-white text-black font-bold text-xs hover:bg-zinc-200 disabled:opacity-30 transition-all shadow-md active:scale-95"
            >
              Save Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};