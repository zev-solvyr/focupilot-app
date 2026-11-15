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
  isAdding?: boolean;
  setIsAdding?: (adding: boolean) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  tasks,
  sessions = [],
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onReorderTasks,
  isAdding: externalIsAdding,
  setIsAdding: externalSetIsAdding,
}) => {
  const [internalIsAdding, setInternalIsAdding] = useState(false);
  const isAdding = externalIsAdding !== undefined ? externalIsAdding : internalIsAdding;
  const setIsAdding = externalSetIsAdding || setInternalIsAdding;

  const [taskText, setTaskText] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) {
      setTimeout(() => inputRef.current?.focus(), 50);
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
    <div className="space-y-4 pb-32 max-w-xl mx-auto px-2 sm:px-0 relative min-h-[calc(100vh-140px)]">
      {/* 1. Monthly Calendar at Top with Today's Date Highlighted */}
      <MonthCalendar sessions={sessions} tasks={tasks} />

      {/* 2. Tasks Section Header */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Today's Tasks
            </h2>
            <span className="text-[11px] text-zinc-500 font-mono">
              {tasks.filter((t) => t.completed).length} of {tasks.length} done
            </span>
          </div>
        </div>

        {/* 3. Tasks List with Up/Down and Drag Reordering */}
        {tasks.length === 0 ? (
          <div
            onClick={() => setIsAdding(true)}
            className="text-center py-14 ios-matte-panel rounded-3xl border border-dashed border-white/10 cursor-pointer hover:border-white/20 transition-all"
          >
            <p className="text-xs text-zinc-400 font-medium">No tasks for today.</p>
            <p className="text-[11px] text-zinc-600 mt-1">Tap the + button below to add your first task.</p>
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
                className={`flex items-center justify-between p-3.5 rounded-2xl transition-all ${
                  draggedIndex === index ? 'opacity-30 border-white' : ''
                } ${
                  task.completed
                    ? 'bg-black/60 border border-white/5 opacity-40'
                    : 'ios-matte-card'
                }`}
              >
                {/* Drag Handle & Checkbox & Title */}
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                  <div className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-300 p-0.5">
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  <button
                    onClick={() => handleTaskToggle(task.id, task.completed)}
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                      task.completed
                        ? 'bg-white border-white text-black'
                        : 'border-white/20 bg-black/40 hover:border-white'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
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
                    className="p-1.5 text-zinc-500 hover:text-white disabled:opacity-20 transition-colors rounded-lg hover:bg-white/5"
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => moveTaskDown(index)}
                    disabled={index === tasks.length - 1}
                    className="p-1.5 text-zinc-500 hover:text-white disabled:opacity-20 transition-colors rounded-lg hover:bg-white/5"
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 text-zinc-600 hover:text-white transition-colors ml-1 rounded-lg hover:bg-white/5"
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

      {/* 4. Down Right Side Easily Accessible Big Size + Button */}
      <button
        onClick={() => setIsAdding(true)}
        className="fixed bottom-22 right-5 sm:right-8 z-40 w-14 h-14 rounded-full bg-white text-black font-extrabold flex items-center justify-center shadow-[0_10px_30px_rgba(255,255,255,0.25)] hover:bg-zinc-200 active:scale-90 transition-all border border-white/20"
        title="Add task"
        aria-label="Add task"
      >
        <Plus className="w-7 h-7 stroke-[2.8]" />
      </button>

      {/* 5. iOS Matte Task Input Sheet */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg mb-20 sm:mb-0 p-4 rounded-3xl ios-matte-sheet flex items-center gap-2.5 animate-slideUp"
          >
            <input
              ref={inputRef}
              type="text"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              placeholder="Type task name..."
              className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none px-2 py-1"
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
              className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 disabled:opacity-20 transition-all shadow-sm active:scale-95 shrink-0"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setTaskText('');
              }}
              className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/10 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};