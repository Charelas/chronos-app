import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  getEntries, saveEntries, addEntry as addEntryToStorage, deleteEntry as deleteEntryFromStorage,
  clearAllEntries, resetOnboarding,
  getSettings, saveSettings as saveSettingsToStorage,
  getTimerState, saveTimerState,
  getOnboarded, setOnboarded as setOnboardedStorage,
  getSeedEntries, generateId,
  computeTotalBalance, getCategoryBalanceSign,
  TimeEntry, TimerState, AppSettings, defaultSettings,
} from '../utils/storage';
import { invalidateInsightCache } from '../utils/gemini';

type AppContextType = {
  entries: TimeEntry[];
  settings: AppSettings;
  timer: TimerState;
  elapsed: number; // seconds
  isOnboarded: boolean | null; // null = not yet determined
  totalBalance: number;
  weeklyHours: number;
  monthlyHours: number;
  loading: boolean;

  addEntry: (entry: Omit<TimeEntry, 'id'>) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  startTimer: (task: string, category: string) => Promise<void>;
  stopTimer: () => Promise<TimeEntry | null>;
  completeOnboarding: () => Promise<void>;
  refreshData: () => Promise<void>;
  clearEntries: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [timer, setTimer] = useState<TimerState>({ isRunning: false, startedAt: null, currentTask: '', category: 'Work' });
  const [elapsed, setElapsed] = useState(0);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null); // null = loading
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate derived stats with useMemo to avoid recompute on every render
  const { totalBalance, weeklyHours, monthlyHours } = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekEntries = entries.filter(e => new Date(e.date) >= weekStart);
    const monthEntries = entries.filter(e => new Date(e.date) >= monthStart);

    const weeklyHours = weekEntries.reduce((sum, e) => sum + e.durationMinutes / 60, 0);
    const monthlyHours = monthEntries.reduce((sum, e) => sum + e.durationMinutes / 60, 0);

    // Canonical formula: sum of signed hours (Work/OT/Meeting = +, Personal/Education = -)
    const totalBalance = computeTotalBalance(entries);

    return { totalBalance, weeklyHours, monthlyHours };
  }, [entries]);

  // Timer tick
  useEffect(() => {
    if (timer.isRunning && timer.startedAt) {
      timerRef.current = setInterval(() => {
        const start = new Date(timer.startedAt!).getTime();
        const now = Date.now();
        setElapsed(Math.floor((now - start) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timer.isRunning, timer.startedAt]);

  // Load initial data
  useEffect(() => {
    (async () => {
      try {
        const [loadedEntries, loadedSettings, loadedTimer, onboarded] = await Promise.all([
          getEntries(),
          getSettings(),
          getTimerState(),
          getOnboarded(),
        ]);

        // Seed data on first launch
        if (loadedEntries.length === 0) {
          const seed = getSeedEntries();
          await saveEntries(seed);
          setEntries(seed);
        } else {
          setEntries(loadedEntries);
        }

        setSettings(loadedSettings);
        setTimer(loadedTimer);
        setIsOnboarded(onboarded);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addEntryFn = useCallback(async (entry: Omit<TimeEntry, 'id'>) => {
    const newEntry: TimeEntry = { ...entry, id: generateId() };
    const updated = await addEntryToStorage(newEntry);
    setEntries(updated);
    await invalidateInsightCache(); // new entry — force fresh insight next open
  }, []);

  const removeEntry = useCallback(async (id: string) => {
    const updated = await deleteEntryFromStorage(id);
    setEntries(updated);
    await invalidateInsightCache(); // data changed — force fresh insight next open
  }, []);

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial };
    await saveSettingsToStorage(updated);
    setSettings(updated);
  }, [settings]);

  const startTimerFn = useCallback(async (task: string, category: string) => {
    const state: TimerState = {
      isRunning: true,
      startedAt: new Date().toISOString(),
      currentTask: task,
      category,
    };
    await saveTimerState(state);
    setTimer(state);
  }, []);

  const stopTimer = useCallback(async (): Promise<TimeEntry | null> => {
    if (!timer.isRunning || !timer.startedAt) return null;

    const start = new Date(timer.startedAt);
    const end = new Date();
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    const category = timer.category as TimeEntry['category'];
    // R-BUG-001 fix: apply canonical sign rule so Personal/Education = negative balance
    const balanceHours = getCategoryBalanceSign(category) * (durationMinutes / 60);

    const entry: TimeEntry = {
      id: generateId(),
      date: start.toISOString().split('T')[0],
      startTime: `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`,
      endTime: `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`,
      category,
      description: timer.currentTask,
      durationMinutes,
      balanceHours,
    };

    const updated = await addEntryToStorage(entry);
    setEntries(updated);
    await invalidateInsightCache(); // new session logged — force fresh insight next open

    const stoppedState: TimerState = { isRunning: false, startedAt: null, currentTask: '', category: 'Work' };
    await saveTimerState(stoppedState);
    setTimer(stoppedState);

    return entry;
  }, [timer]);

  const completeOnboarding = useCallback(async () => {
    await setOnboardedStorage();
    setIsOnboarded(true);
  }, []);

  const refreshData = useCallback(async () => {
    const loadedEntries = await getEntries();
    setEntries(loadedEntries);
  }, []);

  // BUG-002 fix: clears storage AND syncs React state
  const clearEntries = useCallback(async () => {
    await clearAllEntries();
    setEntries([]);
  }, []);

  // R-CS-003: abstract resetOnboarding so settings.tsx doesn't touch AsyncStorage directly
  const signOut = useCallback(async () => {
    await resetOnboarding();
    setIsOnboarded(false);
  }, []);

  return (
    <AppContext.Provider value={{
      entries, settings, timer, elapsed, isOnboarded,
      totalBalance, weeklyHours, monthlyHours, loading,
      addEntry: addEntryFn, removeEntry, updateSettings,
      startTimer: startTimerFn, stopTimer,
      completeOnboarding, refreshData, clearEntries, signOut,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
