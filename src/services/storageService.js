// LocalStorage service with clean abstractions and backup capabilities
import { SUGGESTED_ROUTINE, getTodayDateString } from '../utils/timeUtils';

const KEYS = {
  SETTINGS: 'habitplus_settings',
  ROUTINE: 'habitplus_routine_template',
  DAILY_TASKS: 'habitplus_daily_tasks',
  DAILY_DATE: 'habitplus_daily_date',
  HISTORY: 'habitplus_history_logs',
  STREAK: 'habitplus_streak_data',
  AI_CONFIG: 'habitplus_active_ai_config',
  CHAT_MESSAGES: 'habitplus_mentor_messages',
};

const DEFAULT_SETTINGS = {
  name: '',
  theme: 'night',
  language: 'en',
  notificationsEnabled: false,
  streakTargetPercent: 70,
  onboardingDone: false,
  installed: false,
};

const DEFAULT_STREAK = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
};

export const getSettings = () => {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch (e) {
    console.error('Error reading settings:', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings) => {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
};

export const getRoutineTemplate = () => {
  try {
    const raw = localStorage.getItem(KEYS.ROUTINE);
    return raw ? JSON.parse(raw) : SUGGESTED_ROUTINE;
  } catch (e) {
    console.error('Error reading routine:', e);
    return SUGGESTED_ROUTINE;
  }
};

export const saveRoutineTemplate = (routine) => {
  try {
    localStorage.setItem(KEYS.ROUTINE, JSON.stringify(routine));
  } catch (e) {
    console.error('Error saving routine:', e);
  }
};

export const getDailyTasks = () => {
  try {
    const raw = localStorage.getItem(KEYS.DAILY_TASKS);
    const date = localStorage.getItem(KEYS.DAILY_DATE);
    return {
      tasks: raw ? JSON.parse(raw) : null,
      date: date || null,
    };
  } catch (e) {
    console.error('Error reading daily tasks:', e);
    return { tasks: null, date: null };
  }
};

export const saveDailyTasks = (tasks, date = getTodayDateString()) => {
  try {
    localStorage.setItem(KEYS.DAILY_TASKS, JSON.stringify(tasks));
    localStorage.setItem(KEYS.DAILY_DATE, date);
  } catch (e) {
    console.error('Error saving daily tasks:', e);
  }
};

export const getHistoryLogs = () => {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading history:', e);
    return [];
  }
};

export const appendHistoryLog = (logEntry) => {
  try {
    const history = getHistoryLogs();
    // Anti-cheat: prevent duplicate entries for same date, but preserve immutability
    const existingIndex = history.findIndex((h) => h.date === logEntry.date);
    let updated;
    if (existingIndex >= 0) {
      // already exists; keep original or update if closing out today
      updated = [...history];
      updated[existingIndex] = logEntry;
    } else {
      updated = [logEntry, ...history];
    }
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving history log:', e);
    return getHistoryLogs();
  }
};

export const getStreakData = () => {
  try {
    const raw = localStorage.getItem(KEYS.STREAK);
    return raw ? { ...DEFAULT_STREAK, ...JSON.parse(raw) } : DEFAULT_STREAK;
  } catch (e) {
    console.error('Error reading streak:', e);
    return DEFAULT_STREAK;
  }
};

export const saveStreakData = (streakData) => {
  try {
    localStorage.setItem(KEYS.STREAK, JSON.stringify(streakData));
  } catch (e) {
    console.error('Error saving streak:', e);
  }
};

export const getMentorMessages = () => {
  try {
    const raw = localStorage.getItem(KEYS.CHAT_MESSAGES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveMentorMessages = (msgs) => {
  try {
    localStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(msgs));
  } catch {
    // ignore
  }
};

export const exportAllData = () => {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    settings: getSettings(),
    routine: getRoutineTemplate(),
    daily: getDailyTasks(),
    history: getHistoryLogs(),
    streak: getStreakData(),
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `HabitPlus_Backup_${getTodayDateString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const validateAndImportData = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (!data.settings || !Array.isArray(data.routine)) {
      throw new Error('Invalid structure');
    }
    if (data.settings) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings));
    if (data.routine) localStorage.setItem(KEYS.ROUTINE, JSON.stringify(data.routine));
    if (data.daily && data.daily.tasks) {
      localStorage.setItem(KEYS.DAILY_TASKS, JSON.stringify(data.daily.tasks));
      localStorage.setItem(KEYS.DAILY_DATE, data.daily.date || getTodayDateString());
    }
    if (Array.isArray(data.history)) localStorage.setItem(KEYS.HISTORY, JSON.stringify(data.history));
    if (data.streak) localStorage.setItem(KEYS.STREAK, JSON.stringify(data.streak));
    return true;
  } catch (e) {
    console.error('Import error:', e);
    return false;
  }
};

export const resetAllData = () => {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
};
