import React, { useState } from 'react';
import { X, Plus, Calendar, Clock } from 'lucide-react';
import { Task, Category, Priority, Goal } from '../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: Task) => void;
  goals: Goal[];
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAdd, goals }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('high');
  const [category, setCategory] = useState<Category>('career');
  const [duration, setDuration] = useState(25);
  const [scheduledTime, setScheduledTime] = useState('09:30');
  const [goalId, setGoalId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: title.trim(),
      completed: false,
      priority,
      category,
      durationMinutes: Number(duration) || 25,
      scheduledTime: scheduledTime || undefined,
      goalId: goalId || undefined,
    };

    onAdd(newTask);
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-black rounded-3xl p-6 border border-zinc-800 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white rounded-full bg-zinc-950 border border-zinc-900"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-white" />
          Schedule New Action Item
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Task Title</label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Code authentication service"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
            />
          </div>

          {/* Priority & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
              >
                <option value="high">High Priority</option>
                <option value="medium">Standard</option>
                <option value="low">Secondary</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
              >
                <option value="career">Career & Wealth</option>
                <option value="health">Health & Body</option>
                <option value="finance">Finance</option>
                <option value="learning">Knowledge</option>
                <option value="personal">Personal</option>
              </select>
            </div>
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-white" /> Time Block
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-white" /> Duration (mins)
              </label>
              <input
                type="number"
                min="5"
                max="240"
                step="5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white font-mono"
              />
            </div>
          </div>

          {/* Goal Link */}
          {goals.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Link to Goal (Optional)</label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
              >
                <option value="">No goal linked</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-2 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors shadow-sm"
          >
            Add to Schedule
          </button>
        </form>
      </div>
    </div>
  );
};
