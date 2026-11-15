export type Category = 'career' | 'health' | 'finance' | 'learning' | 'personal';

export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  durationMinutes: number;
  scheduledTime?: string; // e.g. "09:00"
  goalId?: string;
  completedAt?: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  targetDate?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: Category;
  targetDate: string;
  progress: number; // 0-100
  milestones: Milestone[];
  createdAt: string;
}

export interface FocusSession {
  id: string;
  durationMinutes: number;
  category: Category;
  taskTitle?: string;
  goalId?: string;
  timestamp: string;
}

export interface DailyCheckIn {
  date: string; // YYYY-MM-DD
  energyLevel: number; // 1-5
  focusIntent: string;
  mood: string;
  topPriorityTaskId?: string;
  completed: boolean;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string;
  content: string;
  mood: 'energized' | 'focused' | 'calm' | 'tired' | 'stressed';
  insights?: string;
}

export interface MentorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface UserSettings {
  userName: string;
  geminiApiKey: string;
  dailyFocusTargetMinutes: number;
  soundEnabled: boolean;
  theme: 'dark' | 'midnight';
}
