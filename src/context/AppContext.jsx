import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getSettings,
  saveSettings,
  getRoutineTemplate,
  saveRoutineTemplate,
  getDailyTasks,
  saveDailyTasks,
  getHistoryLogs,
  appendHistoryLog,
  getStreakData,
  saveStreakData,
} from '../services/storageService';
import {
  getTodayDateString,
  evaluateTaskStatus,
  timeToMinutes,
  SUGGESTED_ROUTINE,
} from '../utils/timeUtils';
import { calculateDynamicPoints } from '../services/pointsService';
import { checkAndTriggerNotifications } from '../services/notificationService';
import { triggerTaskSuccessConfetti, triggerDayGoalMetConfetti } from '../utils/soundOrEffects';
import { translations } from '../utils/translations';
import { useToast } from './ToastContext';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { showToast } = useToast();

  // Persistent States
  const [settings, setSettingsState] = useState(getSettings);
  const [routine, setRoutineState] = useState(getRoutineTemplate);
  const [dailyTasks, setDailyTasksState] = useState([]);
  const [historyLogs, setHistoryLogsState] = useState(getHistoryLogs);
  const [streakData, setStreakDataState] = useState(getStreakData);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Modals & Panels
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAIConnectionTestOpen, setIsAIConnectionTestOpen] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  const t = translations[settings.language] || translations.en;

  // Track if daily goal was already celebrated today
  const celebratedTodayRef = useRef(false);

  // Update Settings
  const updateSettings = useCallback((newSettings) => {
    setSettingsState((prev) => {
      const merged = { ...prev, ...newSettings };
      saveSettings(merged);
      return merged;
    });
  }, []);

  // Update Theme class on HTML root
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'day') {
      root.classList.remove('dark');
      root.classList.add('day-mode');
    } else {
      root.classList.add('dark');
      root.classList.remove('day-mode');
    }
  }, [settings.theme]);

  // PWA BeforeInstallPrompt listener & standalone detection
  useEffect(() => {
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(!!checkStandalone);

    const handler = (e) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Live Clock Tick (every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /**
   * Finalize a specific day's tasks into History and update streak
   */
  const finalizeDay = useCallback((dateStr, tasksList) => {
    const completedTasks = tasksList.filter((t) => t.status === 'done');
    const finalScore = completedTasks.reduce((acc, t) => acc + (t.points || 0), 0);
    const doneCount = completedTasks.length;
    const missedCount = tasksList.length - doneCount;
    const targetMet = finalScore >= (settings.streakTargetPercent || 70);

    const historyEntry = {
      date: dateStr,
      score: finalScore,
      totalPossiblePoints: 100,
      doneCount,
      missedCount,
      targetMet,
      tasks: tasksList.map((t) => ({
        id: t.id,
        title: t.title,
        type: t.type,
        category: t.category,
        startTime: t.startTime,
        endTime: t.endTime,
        points: t.points,
        status: t.status === 'done' ? 'done' : 'missed',
        completedAt: t.completedAt || null,
      })),
    };

    // Save to History (immutable)
    const updatedHistory = appendHistoryLog(historyEntry);
    setHistoryLogsState(updatedHistory);

    // Update Streak
    setStreakDataState((prev) => {
      let current = prev.currentStreak;
      if (targetMet) {
        current += 1;
      } else {
        current = 0;
      }
      const longest = Math.max(prev.longestStreak, current);
      const updatedStreak = {
        currentStreak: current,
        longestStreak: longest,
        lastCompletedDate: dateStr,
      };
      saveStreakData(updatedStreak);
      return updatedStreak;
    });

    return historyEntry;
  }, [settings.streakTargetPercent]);

  /**
   * Initialize or catch-up Daily Tasks
   */
  const initOrSyncDailyTasks = useCallback(() => {
    const todayStr = getTodayDateString();
    const stored = getDailyTasks();

    if (stored.date && stored.date !== todayStr && stored.tasks && stored.tasks.length) {
      // Previous day wasn't closed -> Finalize it into History!
      finalizeDay(stored.date, stored.tasks);
      showToast(`Day closed for ${stored.date}. Results saved to history.`, 'info');
    }

    if (!stored.tasks || stored.date !== todayStr) {
      // New day instance: Generate from Routine template
      const currentRoutine = getRoutineTemplate();
      const freshTasks = currentRoutine.map((r) => ({
        ...r,
        routineId: r.id,
        id: `task_${todayStr}_${r.id}`,
        status: 'upcoming',
        completedAt: null,
      }));

      // Evaluate initial status based on current time
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const initialEvaluated = freshTasks.map((t) => {
        const status = evaluateTaskStatus(t, nowMin);
        return { ...t, status };
      });

      saveDailyTasks(initialEvaluated, todayStr);
      setDailyTasksState(initialEvaluated);
    } else {
      // Same day: evaluate status changes based on clock
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const updated = stored.tasks.map((t) => {
        if (t.status === 'done') return t;
        const currentEval = evaluateTaskStatus(t, nowMin);
        return { ...t, status: currentEval };
      });
      saveDailyTasks(updated, todayStr);
      setDailyTasksState(updated);
    }
  }, [finalizeDay, showToast]);

  // Run initial sync on mount and when date changes
  useEffect(() => {
    initOrSyncDailyTasks();
  }, [initOrSyncDailyTasks]);

  // Periodic status re-evaluation and notifications check (every 10s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();

      setDailyTasksState((prev) => {
        if (!prev.length) return prev;
        let changed = false;
        const updated = prev.map((t) => {
          if (t.status === 'done') return t;
          const newStatus = evaluateTaskStatus(t, nowMin);
          if (newStatus !== t.status) {
            changed = true;
            return { ...t, status: newStatus };
          }
          return t;
        });

        if (changed) {
          saveDailyTasks(updated, getTodayDateString());
        }
        return changed ? updated : prev;
      });

      // Check smart notifications
      checkAndTriggerNotifications(dailyTasks, settings.notificationsEnabled);
    }, 10000);

    return () => clearInterval(interval);
  }, [dailyTasks, settings.notificationsEnabled]);

  /**
   * Action: Mark task as Done (Section 10)
   */
  const markTaskDone = useCallback((taskId) => {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    let targetTask = null;
    let earnedPoints = 0;

    setDailyTasksState((prev) => {
      const updated = prev.map((t) => {
        if (t.id === taskId) {
          // Verify time window
          const startMin = timeToMinutes(t.startTime);
          const endMin = timeToMinutes(t.endTime);
          const graceLimit = endMin + 60;

          if (nowMin < startMin) {
            showToast('Cannot mark as done before scheduled start time!', 'warning');
            return t;
          }

          if (nowMin >= graceLimit) {
            showToast('Grace window expired. Task is missed.', 'error');
            return { ...t, status: 'missed' };
          }

          targetTask = t;
          earnedPoints = t.points || 0;
          return {
            ...t,
            status: 'done',
            completedAt: new Date().toISOString(),
          };
        }
        return t;
      });

      if (targetTask) {
        saveDailyTasks(updated, getTodayDateString());
        triggerTaskSuccessConfetti();
        showToast(`+${earnedPoints} pts! "${targetTask.title}" marked Done!`, 'success');

        // Check if day target is achieved
        const totalDoneScore = updated
          .filter((t) => t.status === 'done')
          .reduce((acc, t) => acc + (t.points || 0), 0);

        if (totalDoneScore >= (settings.streakTargetPercent || 70) && !celebratedTodayRef.current) {
          celebratedTodayRef.current = true;
          triggerDayGoalMetConfetti();
          showToast(`Target Achieved! ${totalDoneScore}/100 pts. Streak extended! 🔥`, 'success', 5000);
        }
      }

      return updated;
    });
  }, [settings.streakTargetPercent, showToast]);

  /**
   * Action: Update Routine (Section 8 & 9)
   */
  const saveRoutineAndUpdateUpcoming = useCallback(async (newRoutineList) => {
    // 1. Save new routine template
    saveRoutineTemplate(newRoutineList);
    setRoutineState(newRoutineList);

    // 2. Synchronize today's upcoming daily tasks
    const todayStr = getTodayDateString();
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    setDailyTasksState((prev) => {
      // Find tasks that are already locked today (done or missed or currently active)
      const locked = prev.filter((t) => t.status === 'done' || t.status === 'missed' || t.status === 'active');
      const lockedRoutineIds = new Set(locked.map((t) => t.routineId));

      // Build updated list for today:
      // Keep locked tasks, and add/update upcoming tasks from new routine
      const newDailyList = [...locked];

      newRoutineList.forEach((r) => {
        if (!lockedRoutineIds.has(r.id)) {
          const startMin = timeToMinutes(r.startTime);
          // If task time hasn't passed today, include it
          if (startMin >= nowMin) {
            const status = evaluateTaskStatus(r, nowMin);
            newDailyList.push({
              ...r,
              routineId: r.id,
              id: `task_${todayStr}_${r.id}`,
              status,
              completedAt: null,
            });
          }
        }
      });

      // Sort by start time
      newDailyList.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      saveDailyTasks(newDailyList, todayStr);
      return newDailyList;
    });
  }, []);

  /**
   * Action: Redistribute 100 points with AI or Smart Fallback (Section 11)
   */
  const triggerPointRedistribution = useCallback(async (routineListToDistribute = null, silent = false) => {
    setIsAiLoading(true);
    try {
      const targetRoutine = routineListToDistribute || routine;
      const res = await calculateDynamicPoints(targetRoutine);

      saveRoutineTemplate(res.tasks);
      setRoutineState(res.tasks);

      // Also update today's points for corresponding tasks
      setDailyTasksState((prev) => {
        const pointsMap = new Map(res.tasks.map((r) => [r.id, r.points]));
        const updated = prev.map((t) => {
          if (t.status === 'done') return t; // Keep locked
          const updatedPoints = pointsMap.get(t.routineId) || t.points;
          return { ...t, points: updatedPoints };
        });
        saveDailyTasks(updated, getTodayDateString());
        return updated;
      });

      if (!silent) {
        if (res.fallbackUsed) {
          showToast('Points allocated (100 pts) using balanced smart formula.', 'info');
        } else {
          showToast('AI successfully balanced 100 marks across habits!', 'success');
        }
      }
    } catch {
      showToast('Error distributing points.', 'error');
    } finally {
      setIsAiLoading(false);
    }
  }, [routine, showToast]);

  /**
   * Action: Load Suggested Routine (Section 8)
   */
  const loadSuggestedRoutine = useCallback(async () => {
    if (isAiLoading) return;
    await saveRoutineAndUpdateUpcoming(SUGGESTED_ROUTINE);
    await triggerPointRedistribution(SUGGESTED_ROUTINE, true);
    showToast('Suggested routine loaded with 100 AI marks!', 'success');
  }, [isAiLoading, saveRoutineAndUpdateUpcoming, triggerPointRedistribution, showToast]);

  /**
   * Action: Clear Routine
   */
  const clearRoutine = useCallback(() => {
    saveRoutineTemplate([]);
    setRoutineState([]);
    setDailyTasksState([]);
    saveDailyTasks([], getTodayDateString());
    showToast('Routine cleared.', 'info');
  }, [showToast]);

  return (
    <AppContext.Provider
      value={{
        t,
        settings,
        updateSettings,
        routine,
        setRoutine: saveRoutineAndUpdateUpcoming,
        dailyTasks,
        historyLogs,
        streakData,
        activeTab,
        setActiveTab,
        currentTime,
        isAiLoading,
        isSettingsOpen,
        setIsSettingsOpen,
        isAIConnectionTestOpen,
        setIsAIConnectionTestOpen,
        installPromptEvent,
        isStandalone,
        markTaskDone,
        loadSuggestedRoutine,
        clearRoutine,
        triggerPointRedistribution,
        initOrSyncDailyTasks,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
