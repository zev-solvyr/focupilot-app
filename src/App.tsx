import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [tabHistory, setTabHistory] = useState<TabType[]>(['today']);

  // Core Data
  const [settings, setSettings] = useState<UserSettings>(() => storage.getSettings());
  const [goals, setGoals] = useState<Goal[]>(() => storage.getGoals());
  const [tasks, setTasks] = useState<Task[]>(() => storage.getTasks());
  const [sessions] = useState<FocusSession[]>(() => storage.getSessions());
  const [journal, setJournal] = useState<JournalEntry[]>(() => storage.getJournalEntries());
  const [mentorChat, setMentorChat] = useState<MentorMessage[]>(() => storage.getMentorChat());

  // Screen & Modal states for back navigation
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Switch tabs and track navigation history
  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    setTabHistory((prev) => [...prev, newTab]);
    setActiveTab(newTab);
    window.history.pushState({ screen: newTab }, '');
  };

  // Open modals with history push
  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
    window.history.pushState({ screen: 'settings' }, '');
  };

  const handleOpenAddGoal = () => {
    setIsAddGoalOpen(true);
    window.history.pushState({ screen: 'add-goal' }, '');
  };

  const handleSelectGoal = (goal: Goal | null) => {
    setSelectedGoal(goal);
    if (goal) {
      window.history.pushState({ screen: 'goal-details' }, '');
    }
  };

  const handleSetIsAddingTask = (adding: boolean) => {
    setIsAddingTask(adding);
    if (adding) {
      window.history.pushState({ screen: 'add-task' }, '');
    }
  };

  // Unified Go Back Handler
  const goBack = useCallback(() => {
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
      return true;
    }
    if (isAddGoalOpen) {
      setIsAddGoalOpen(false);
      return true;
    }
    if (selectedGoal) {
      setSelectedGoal(null);
      return true;
    }
    if (isAddingTask) {
      setIsAddingTask(false);
      return true;
    }
    if (tabHistory.length > 1) {
      const nextHistory = [...tabHistory];
      nextHistory.pop(); // remove current tab
      const prevTab = nextHistory[nextHistory.length - 1];
      setTabHistory(nextHistory);
      setActiveTab(prevTab);
      return true;
    }
    if (activeTab !== 'today') {
      setActiveTab('today');
      setTabHistory(['today']);
      return true;
    }
    return false;
  }, [isSettingsOpen, isAddGoalOpen, selectedGoal, isAddingTask, tabHistory, activeTab]);

  // Handle browser / hardware back button (popstate)
  useEffect(() => {
    const handlePopState = () => {
      goBack();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [goBack]);

  // Touch Edge Swipe-Back Gesture for Mobile
  const touchStartRef = useRef<{ x: number; y: number; isEdge: boolean }>({ x: 0, y: 0, isEdge: false });

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      // Starts within the left 50px of the screen (iOS standard edge swipe threshold)
      const isEdge = touch.clientX <= 50;
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        isEdge,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current.isEdge || e.changedTouches.length !== 1) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // Swiped right by at least 60px with minimal vertical deflection (< 75px)
      if (deltaX > 60 && Math.abs(deltaY) < 75) {
        goBack();
      }
      touchStartRef.current = { x: 0, y: 0, isEdge: false };
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [goBack]);

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
        onOpenSettings={handleOpenSettings}
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
            isAdding={isAddingTask}
            setIsAdding={handleSetIsAddingTask}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsView
            goals={goals}
            selectedGoal={selectedGoal}
            onSelectGoal={handleSelectGoal}
            onOpenAddGoal={handleOpenAddGoal}
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
      <BottomNav activeTab={activeTab} onChangeTab={handleTabChange} />

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