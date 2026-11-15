import { Goal, Task, FocusSession, DailyCheckIn, JournalEntry, MentorMessage, UserSettings } from '../types';

const STORAGE_KEYS = {
  GOALS: 'focuspilot_goals',
  TASKS: 'focuspilot_tasks',
  SESSIONS: 'focuspilot_sessions',
  CHECKINS: 'focuspilot_checkins',
  JOURNAL: 'focuspilot_journal',
  MENTOR_CHAT: 'focuspilot_mentor_chat',
  SETTINGS: 'focuspilot_settings',
  CLEAN_FLAG: 'focuspilot_cleaned_v2',
};

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const defaultSettings: UserSettings = {
  userName: '',
  geminiApiKey: '',
  dailyFocusTargetMinutes: 90,
  soundEnabled: true,
  theme: 'dark',
};

// Auto-clean any legacy demo data from previous sessions
function ensureCleanSlate() {
  if (typeof window === 'undefined') return;
  const isCleaned = localStorage.getItem(STORAGE_KEYS.CLEAN_FLAG);
  if (!isCleaned) {
    const rawGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (rawGoals && rawGoals.includes('Master Fullstack')) {
      localStorage.removeItem(STORAGE_KEYS.GOALS);
      localStorage.removeItem(STORAGE_KEYS.TASKS);
      localStorage.removeItem(STORAGE_KEYS.SESSIONS);
      localStorage.removeItem(STORAGE_KEYS.JOURNAL);
      localStorage.removeItem(STORAGE_KEYS.MENTOR_CHAT);
    }
    localStorage.setItem(STORAGE_KEYS.CLEAN_FLAG, 'true');
  }
}

ensureCleanSlate();

export const storage = {
  // Settings
  getSettings(): UserSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    return { ...defaultSettings, ...JSON.parse(raw) };
  },

  saveSettings(settings: UserSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Goals - 100% User created
  getGoals(): Goal[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
    return raw ? JSON.parse(raw) : [];
  },

  saveGoals(goals: Goal[]): void {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  },

  addGoal(goal: Goal): void {
    const goals = this.getGoals();
    goals.unshift(goal);
    this.saveGoals(goals);
  },

  updateGoal(updatedGoal: Goal): void {
    const goals = this.getGoals().map((g) => (g.id === updatedGoal.id ? updatedGoal : g));
    this.saveGoals(goals);
  },

  deleteGoal(id: string): void {
    const goals = this.getGoals().filter((g) => g.id !== id);
    this.saveGoals(goals);
  },

  // Tasks - 100% User created
  getTasks(): Task[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    return raw ? JSON.parse(raw) : [];
  },

  saveTasks(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  addTask(task: Task): void {
    const tasks = this.getTasks();
    tasks.unshift(task);
    this.saveTasks(tasks);
  },

  updateTask(updatedTask: Task): void {
    const tasks = this.getTasks().map((t) => (t.id === updatedTask.id ? updatedTask : t));
    this.saveTasks(tasks);
  },

  deleteTask(id: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== id);
    this.saveTasks(tasks);
  },

  // Focus Sessions - Real logged sessions only
  getSessions(): FocusSession[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return raw ? JSON.parse(raw) : [];
  },

  addSession(session: FocusSession): void {
    const sessions = this.getSessions();
    sessions.unshift(session);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  },

  // Daily Checkin
  getCheckIn(date: string = getTodayDateString()): DailyCheckIn | null {
    const raw = localStorage.getItem(`${STORAGE_KEYS.CHECKINS}_${date}`);
    return raw ? JSON.parse(raw) : null;
  },

  saveCheckIn(checkIn: DailyCheckIn): void {
    localStorage.setItem(`${STORAGE_KEYS.CHECKINS}_${checkIn.date}`, JSON.stringify(checkIn));
  },

  // Journal
  getJournalEntries(): JournalEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.JOURNAL);
    return raw ? JSON.parse(raw) : [];
  },

  addJournalEntry(entry: JournalEntry): void {
    const entries = this.getJournalEntries();
    entries.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(entries));
  },

  // Mentor Chat - Empty initially
  getMentorChat(): MentorMessage[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MENTOR_CHAT);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  },

  saveMentorChat(messages: MentorMessage[]): void {
    localStorage.setItem(STORAGE_KEYS.MENTOR_CHAT, JSON.stringify(messages));
  },

  // Calculate Today's Focus Score (0 - 100) dynamically from actual data
  calculateDailyFocusScore(): {
    score: number;
    tasksRatio: number;
    deepWorkRatio: number;
    checkInDone: boolean;
    todayFocusMinutes: number;
  } {
    const tasks = this.getTasks();
    const settings = this.getSettings();
    const todayStr = getTodayDateString();

    // 1. Task Score (up to 55 pts)
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const tasksRatio = totalTasks > 0 ? completedTasks / totalTasks : 0;
    const taskPoints = Math.round(tasksRatio * 55);

    // 2. Focus Minutes Score (up to 45 pts)
    const sessions = this.getSessions();
    const todaySessions = sessions.filter((s) => s.timestamp.startsWith(todayStr));
    const todayFocusMinutes = todaySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const targetMinutes = Math.max(settings.dailyFocusTargetMinutes || 90, 30);
    const deepWorkRatio = Math.min(todayFocusMinutes / targetMinutes, 1);
    const focusPoints = Math.round(deepWorkRatio * 45);

    const totalScore = Math.min(100, Math.max(0, taskPoints + focusPoints));

    return {
      score: totalScore,
      tasksRatio: Math.round(tasksRatio * 100),
      deepWorkRatio: Math.round(deepWorkRatio * 100),
      checkInDone: true,
      todayFocusMinutes,
    };
  },

  // Clear all data to fresh start
  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.JOURNAL);
    localStorage.removeItem(STORAGE_KEYS.MENTOR_CHAT);
    const todayStr = getTodayDateString();
    localStorage.removeItem(`${STORAGE_KEYS.CHECKINS}_${todayStr}`);
  },

  exportData(): string {
    const data = {
      settings: this.getSettings(),
      goals: this.getGoals(),
      tasks: this.getTasks(),
      sessions: this.getSessions(),
      journal: this.getJournalEntries(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },

  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) this.saveSettings(data.settings);
      if (data.goals) this.saveGoals(data.goals);
      if (data.tasks) this.saveTasks(data.tasks);
      if (data.sessions) localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions));
      if (data.journal) localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(data.journal));
      return true;
    } catch {
      return false;
    }
  },
};
