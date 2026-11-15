import { useState } from 'react';
import { TabType, BottomNav } from './components/BottomNav';
import { Navbar } from './components/Navbar';
import { TodayView } from './views/TodayView';
import { GoalsView } from './views/GoalsView';
import { MentorView } from './views/MentorView';
import { JournalView } from './views/JournalView';

import { SettingsModal } from './components/SettingsModal';
import { AddGoalModal } from './components/AddGoalModal';

import { storage } from './services/storage';
import { Goal, Task, FocusSession, JournalEntry, MentorMessage, UserSettings } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('today');

  // Core Data
  const [settings, setSettings] = useState<UserSettings>(() => storage.getSettings());
  const [goals, setGoals] = useState<Goal[]>(() => storage.getGoals());
  const [tasks, setTasks] = useState<Task[]>(() => storage.getTasks());
  const [sessions] = useState<FocusSession[]>(() => storage.getSessions());
  const [journal, setJournal] = useState<JournalEntry[]>(() => storage.getJournalEntries());
  const [mentorChat, setMentorChat] = useState<MentorMessage[]>(() => storage.getMentorChat());

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);

  // Tasks handlers
  const handleAddTask = (newTask: Task) => {
    storage.addTask(newTask);
    setTasks(storage.getTasks());
  };

  const handleToggleTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updated = {
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : undefined,
    };
    storage.updateTask(updated);
    setTasks(storage.getTasks());
  };

  const handleDeleteTask = (taskId: string) => {
    storage.deleteTask(taskId);
    setTasks(storage.getTasks());
  };

  const handleReorderTasks = (newTasks: Task[]) => {
    storage.saveTasks(newTasks);
    setTasks(newTasks);
  };

  // Goals handlers
  const handleAddGoal = (newGoal: Goal) => {
    storage.addGoal(newGoal);
    setGoals(storage.getGoals());
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    storage.updateGoal(updatedGoal);
    setGoals(storage.getGoals());
  };

  const handleDeleteGoal = (goalId: string) => {
    storage.deleteGoal(goalId);
    setGoals(storage.getGoals());
  };

  // Journal handlers
  const handleAddJournalEntry = (entry: JournalEntry) => {
    storage.addJournalEntry(entry);
    setJournal(storage.getJournalEntries());
  };

  const handleDeleteJournalEntry = (id: string) => {
    const updated = journal.filter((j) => j.id !== id);
    setJournal(updated);
    localStorage.setItem('focuspilot_journal', JSON.stringify(updated));
  };

  // Mentor Chat handler
  const handleSaveMentorMessages = (msgs: MentorMessage[]) => {
    storage.saveMentorChat(msgs);
    setMentorChat(msgs);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Top Navigation */}
      <Navbar
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-5 mt-1">
        {activeTab === 'today' && (
          <TodayView
            tasks={tasks}
            sessions={sessions}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onReorderTasks={handleReorderTasks}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsView
            goals={goals}
            onOpenAddGoal={() => setIsAddGoalOpen(true)}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {activeTab === 'journal' && (
          <JournalView
            entries={journal}
            onAddEntry={handleAddJournalEntry}
            onDeleteEntry={handleDeleteJournalEntry}
          />
        )}

        {activeTab === 'mentor' && (
          <MentorView
            messages={mentorChat}
            onSaveMessages={handleSaveMentorMessages}
            context={{
              focusScore: Math.round((tasks.filter((t) => t.completed).length / (tasks.length || 1)) * 100),
              activeGoalsCount: goals.length,
              topGoalTitle: goals[0]?.title,
              todayTasksRemaining: tasks.filter((t) => !t.completed).length,
              focusMinutesToday: 0,
              userName: settings.userName,
              hasApiKey: !!settings.geminiApiKey?.trim(),
            }}
          />
        )}
      </main>

      {/* Bottom Floating Navigation Dock */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      <AddGoalModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        onAdd={handleAddGoal}
      />
    </div>
  );
}

export default App;
