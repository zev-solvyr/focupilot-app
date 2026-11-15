import React, { useState, useRef, useEffect } from 'react';
import { Plus, Check, Trash2, Calendar, ChevronUp, ChevronDown, GripVertical, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, FocusSession } from '../types';
import { MonthCalendar } from '../components/MonthCalendar';
import { sound } from '../services/sound';

interface TodayViewProps {
  tasks: Task[];
  sessions?: FocusSession[];
  onAddTask: (task: Task) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onReorderTasks: (tasks: Task[]) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  tasks,
  sessions = [],
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onReorderTasks,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!taskText.trim()) return;

    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: taskText.trim(),
      completed: false,
      priority: 'high',
      category: 'career',
      durationMinutes: 25,
    };

    onAddTask(newTask);
    setTaskText('');
    setIsAdding(false);
  };

  const handleTaskToggle = (id: string, currentStatus: boolean) => {
    onToggleTask(id);
    if (!currentStatus) {
      sound.playCompletionChime();
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#ffffff', '#d4d4d8', '#71717a'],
      });
    }
  };

  // Move task up
  const moveTaskUp = (index: number) => {
    if (index === 0) return;
    const newTasks = [...tasks];
    const [moved] = newTasks.splice(index, 1);
    newTasks.splice(index - 1, 0, moved);
    onReorderTasks(newTasks);
  };

  // Move task down
  const moveTaskDown = (index: number) => {
    if (index === tasks.length - 1) return;
    const newTasks = [...tasks];
    const [moved] = newTasks.splice(index, 1);
    newTasks.splice(index + 1, 0, moved);
    onReorderTasks(newTasks);
  };

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newTasks = [...tasks];
    const [draggedItem] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    onReorderTasks(newTasks);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4 pb-28 max-w-xl mx-auto px-2 sm:px-0">
      {/* 1. Monthly Calendar at the Top with Today's Date Highlighted */}
      <MonthCalendar sessions={sessions} tasks={tasks} />

      {/* 2. Tasks Section Header with Only the Prominent + Button */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Today's Tasks
            </h2>
            <span className="text-[11px] text-zinc-500 font-mono">
              {tasks.filter((t) => t.completed).length} of {tasks.length} done
            </span>
          </div>

          {/* Just the prominent, high-contrast + icon button */}
          <button
            onClick={() => setIsAdding(true)}
            className="w-8 h-8 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold flex items-center justify-center transition-all shadow-md active:scale-95"
            title="Add task"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Inline Direct Input when + is clicked */}
        {isAdding && (
          <form
            onSubmit={handleSubmit}
            className="p-3 rounded-2xl glass-panel border-2 border-white flex items-center gap-2 animate-fadeIn"
          >
            <input
              ref={inputRef}
              type="text"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              placeholder="Task name..."
              className="flex-1 bg-transparent text-xs text-white placeholder-zinc-600 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setTaskText('');
                }
              }}
            />
            <button
              type="submit"
              disabled={!taskText.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 disabled:opacity-20 transition-all shadow-sm"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setTaskText('');
              }}
              className="p-1.5 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Tasks List with Up/Down and Drag Reordering */}
        {tasks.length === 0 && !isAdding ? (
          <div
            onClick={() => setIsAdding(true)}
            className="text-center py-12 glass-panel rounded-3xl border border-dashed border-zinc-900 cursor-pointer hover:border-zinc-700 transition-colors"
          >
            <p className="text-xs text-zinc-400 font-medium">No tasks yet.</p>
            <p className="text-[11px] text-zinc-600 mt-1">Tap + above to add a task.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  draggedIndex === index ? 'opacity-30 border-white' : ''
                } ${
                  task.completed
                    ? 'bg-black border-zinc-900/60 opacity-40'
                    : 'glass-panel border-zinc-900 hover:border-zinc-800'
                }`}
              >
                {/* Drag Handle & Checkbox & Title */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
                  <div className="cursor-grab active:cursor-grabbing text-zinc-700 hover:text-zinc-400 p-0.5">
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  <button
                    onClick={() => handleTaskToggle(task.id, task.completed)}
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                      task.completed
                        ? 'bg-white border-white text-black'
                        : 'border-zinc-700 bg-zinc-950 hover:border-white'
                    }`}
                  >
                    {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 flex items-center gap-2">
                    <p
                      className={`text-xs truncate ${
                        task.completed ? 'line-through text-zinc-500' : 'text-zinc-100 font-medium'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.scheduledTime && (
                      <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-0.5 shrink-0">
                        <Calendar className="w-2.5 h-2.5" />
                        {task.scheduledTime}
                      </span>
                    )}
                  </div>
                </div>

                {/* Reordering Controls & Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveTaskUp(index)}
                    disabled={index === 0}
                    className="p-1 text-zinc-600 hover:text-white disabled:opacity-20 transition-colors"
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => moveTaskDown(index)}
                    disabled={index === tasks.length - 1}
                    className="p-1 text-zinc-600 hover:text-white disabled:opacity-20 transition-colors"
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1 text-zinc-700 hover:text-white transition-colors ml-1"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
