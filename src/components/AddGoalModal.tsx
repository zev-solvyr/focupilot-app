import React, { useState } from 'react';
import { X, Sparkles, Target, Trash2, Plus, Loader2 } from 'lucide-react';
import { Goal, Category, Milestone } from '../types';
import { aiService } from '../services/ai';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (goal: Goal) => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('career');
  const [targetDate, setTargetDate] = useState('2026-12-31');
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 'm1', title: 'Phase 1: Foundation and Initial Architecture', completed: false },
    { id: 'm2', title: 'Phase 2: Execution Sprint & Milestone 1', completed: false },
  ]);
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  if (!isOpen) return null;

  const handleAIBreakdown = async () => {
    if (!title.trim()) {
      alert('Please enter a goal title first so the AI can break it down.');
      return;
    }
    setIsGeneratingAI(true);
    try {
      const generated = await aiService.breakdownGoal(title, category, description);
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
      category,
      targetDate,
      progress: 0,
      milestones,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAdd(newGoal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-black rounded-3xl p-6 border border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white rounded-full bg-zinc-950 border border-zinc-900"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-white" />
          Set New Strategic Goal
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Goal Objective</label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build $10k/mo Micro-SaaS or Master System Design"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Pillar / Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
              >
                <option value="career">Career & Wealth</option>
                <option value="health">Health & Bio-Optimization</option>
                <option value="finance">Financial Freedom</option>
                <option value="learning">Knowledge & Skill</option>
                <option value="personal">Personal Life</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Objective Context</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What changes once this goal is conquered?"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
            />
          </div>

          {/* AI Milestones breakdown section */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-300">Actionable Milestones</label>
              <button
                type="button"
                onClick={handleAIBreakdown}
                disabled={isGeneratingAI}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-medium transition-all"
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

            {/* List of Milestones */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto mb-2">
              {milestones.map((m, idx) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black border border-zinc-900 text-xs text-zinc-300"
                >
                  <span className="truncate pr-2">
                    <span className="text-zinc-600 font-mono mr-1.5">{idx + 1}.</span>
                    {m.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMilestone(m.id)}
                    className="text-zinc-600 hover:text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add manual milestone */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMilestoneText}
                onChange={(e) => setNewMilestoneText(e.target.value)}
                placeholder="Add milestone step..."
                className="flex-1 px-2.5 py-1.5 bg-black border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-white"
              />
              <button
                type="button"
                onClick={handleAddMilestone}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-3 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors shadow-sm"
          >
            Create Goal & Launch
          </button>
        </form>
      </div>
    </div>
  );
};
