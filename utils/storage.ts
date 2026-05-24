import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------- Storage Keys ----------

const KEYS = {
  ENTRIES: '@chronos_entries',
  SETTINGS: '@chronos_settings',
  TIMER: '@chronos_timer',
  ONBOARDED: '@chronos_onboarded',
  USER_NAME: '@chronos_user_name',
  CHRONICLES: '@chronos_chronicles',
};

// ---------- Types ----------

export type TimeEntry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  category: 'Work' | 'Overtime' | 'Personal' | 'Meeting' | 'Education';
  description: string;
  durationMinutes: number;
  balanceHours: number;
};

export type TimerState = {
  isRunning: boolean;
  startedAt: string | null;
  currentTask: string;
  category: string;
};

export type AppSettings = {
  weeklyCommitment: number;
  monthlyCap: number;
  timeFormat: '24H' | '12H';
  precision: 'HH:MM' | 'Decimal';
  currency: string;
  darkMode: boolean;
  dailySummary: boolean;
  idleAlerts: boolean;
  userName: string;
};

export const defaultSettings: AppSettings = {
  weeklyCommitment: 40,
  monthlyCap: 160,
  timeFormat: '24H',
  precision: 'HH:MM',
  currency: 'USD ($)',
  darkMode: false,
  dailySummary: true,
  idleAlerts: true,
  userName: '',
};

// ---------- Weekly Chronicle ----------

export type WeeklyChronicle = {
  weekId: string;     // e.g. "2026-W21"
  weekLabel: string;  // e.g. "May 19 – 25, 2026"
  narrative: string;  // AI or rule-based editorial paragraph
  generatedAt: string;
  stats: {
    totalHours: number;
    activeDays: number;
    totalEntries: number;
    peakDay: string;
    peakDayHours: number;
    finalBalance: number;
    topCategory: string;
    weeklyTarget: number;
  };
  source: 'ai' | 'rule';
};

export function getWeekId(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

export function getWeekLabel(date: Date = new Date()): string {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}, ${date.getFullYear()}`;
}

export async function getChronicles(): Promise<WeeklyChronicle[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CHRONICLES);
    return raw ? (JSON.parse(raw) as WeeklyChronicle[]) : [];
  } catch { return []; }
}

export async function saveChronicle(chronicle: WeeklyChronicle): Promise<WeeklyChronicle[]> {
  const existing = await getChronicles();
  const filtered = existing.filter(c => c.weekId !== chronicle.weekId);
  const updated = [chronicle, ...filtered].slice(0, 52); // keep 1 year max
  await AsyncStorage.setItem(KEYS.CHRONICLES, JSON.stringify(updated));
  return updated;
}

// ---------- Entry CRUD ----------

export async function getEntries(): Promise<TimeEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ENTRIES);
    const entries = raw ? JSON.parse(raw) : [];
    if (__DEV__) console.log(`📖 [DB] Loaded ${entries.length} entries from storage`);
    return entries;
  } catch (err) {
    if (__DEV__) console.error('❌ [DB] getEntries error:', err);
    return [];
  }
}

export async function saveEntries(entries: TimeEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(entries));
  if (__DEV__) console.log(`💾 [DB] Saved ${entries.length} entries to storage`);
}

export async function addEntry(entry: TimeEntry): Promise<TimeEntry[]> {
  const entries = await getEntries();
  entries.unshift(entry);
  await saveEntries(entries);
  if (__DEV__) console.log(`✅ [DB] New entry added: "${entry.description}" | ${entry.category} | ${entry.durationMinutes}min | Balance: ${entry.balanceHours}hrs`);
  return entries;
}

export async function deleteEntry(id: string): Promise<TimeEntry[]> {
  const entries = (await getEntries()).filter(e => e.id !== id);
  await saveEntries(entries);
  if (__DEV__) console.log(`🗑️ [DB] Entry deleted: ${id} | ${entries.length} remaining`);
  return entries;
}

// Clears all entries — used by Settings purge action
export async function clearAllEntries(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.ENTRIES);
  if (__DEV__) console.log('🗑️ [DB] All entries purged');
}

// ---------- Settings ----------

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    const settings = raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
    if (__DEV__) console.log(`⚙️ [DB] Settings loaded: weekly=${settings.weeklyCommitment}h, monthly=${settings.monthlyCap}h`);
    return settings;
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  if (__DEV__) console.log(`⚙️ [DB] Settings saved: weekly=${settings.weeklyCommitment}h, monthly=${settings.monthlyCap}h`);
}

// ---------- Timer State ----------

export async function getTimerState(): Promise<TimerState> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TIMER);
    return raw ? JSON.parse(raw) : { isRunning: false, startedAt: null, currentTask: '', category: 'Work' };
  } catch { return { isRunning: false, startedAt: null, currentTask: '', category: 'Work' }; }
}

export async function saveTimerState(state: TimerState): Promise<void> {
  await AsyncStorage.setItem(KEYS.TIMER, JSON.stringify(state));
  if (__DEV__) console.log(`⏱️ [DB] Timer ${state.isRunning ? 'STARTED' : 'STOPPED'}: "${state.currentTask}"`);
}

// ---------- Onboarding ----------

export async function getOnboarded(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
    return val === 'true';
  } catch { return false; }
}

export async function setOnboarded(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
  if (__DEV__) console.log('🎉 [DB] Onboarding completed');
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.ONBOARDED);
  if (__DEV__) console.log('🔄 [DB] Onboarding reset');
}

// ---------- Debug: Dump all data ----------

export async function debugDumpAllData(): Promise<void> {
  if (!__DEV__) return;
  console.log('========== CHRONOS DB DUMP ==========');
  const entries = await getEntries();
  console.log(`📊 Total Entries: ${entries.length}`);
  entries.forEach((e, i) => {
    console.log(`  [${i}] ${e.date} | ${e.startTime}-${e.endTime} | ${e.category} | "${e.description}" | ${e.durationMinutes}min`);
  });
  const settings = await getSettings();
  console.log(`⚙️ Settings:`, JSON.stringify(settings, null, 2));
  const timer = await getTimerState();
  console.log(`⏱️ Timer:`, JSON.stringify(timer));
  const onboarded = await getOnboarded();
  console.log(`🎓 Onboarded: ${onboarded}`);
  console.log('=====================================');
}

// ---------- Utility functions ----------

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function formatBalance(hours: number): string {
  const sign = hours >= 0 ? '+' : '-';
  return `${sign}${Math.abs(hours).toFixed(1)}`;
}

/**
 * Official balance rule:
 * POSITIVE categories (count toward work hours): Work, Overtime, Meeting
 * NEGATIVE categories (count as time away):      Personal, Education
 */
export function getCategoryBalanceSign(category: TimeEntry['category']): 1 | -1 {
  if (category === 'Work' || category === 'Overtime' || category === 'Meeting') return 1;
  return -1;
}

export function getWeekEntries(entries: TimeEntry[]): TimeEntry[] {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return entries.filter(e => new Date(e.date) >= weekStart);
}

export function getMonthEntries(entries: TimeEntry[]): TimeEntry[] {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return entries.filter(e => new Date(e.date) >= monthStart);
}

/**
 * Canonical total balance calculation.
 * Balance = sum of all (work hours) - sum of all (personal/education hours)
 * weeklyCommitment is NOT subtracted here — it's a target, not a debt.
 */
export function computeTotalBalance(entries: TimeEntry[]): number {
  return entries.reduce((sum, e) => {
    return sum + getCategoryBalanceSign(e.category) * (e.durationMinutes / 60);
  }, 0);
}

// ---------- Seed data ----------

export function getSeedEntries(): TimeEntry[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  // Helper: compute balanceHours dynamically using canonical rule
  const bh = (category: TimeEntry['category'], durationMinutes: number) =>
    getCategoryBalanceSign(category) * (durationMinutes / 60);

  return [
    { id: generateId(), date: fmt(today), startTime: '09:15', endTime: '13:35', category: 'Work', description: 'Software Architecture - Deep Work', durationMinutes: 260, balanceHours: bh('Work', 260) },
    { id: generateId(), date: fmt(today), startTime: '12:30', endTime: '13:45', category: 'Personal', description: 'Extended Lunch Break', durationMinutes: 75, balanceHours: bh('Personal', 75) },
    { id: generateId(), date: fmt(yesterday), startTime: '14:00', endTime: '14:55', category: 'Meeting', description: 'Client Stakeholder Sync', durationMinutes: 55, balanceHours: bh('Meeting', 55) },
    { id: generateId(), date: fmt(yesterday), startTime: '10:00', endTime: '13:45', category: 'Work', description: 'Design System Documentation', durationMinutes: 225, balanceHours: bh('Work', 225) },
    { id: generateId(), date: fmt(twoDaysAgo), startTime: '09:00', endTime: '12:20', category: 'Work', description: 'Client Proposal Review - Acme Corp', durationMinutes: 200, balanceHours: bh('Work', 200) },
    { id: generateId(), date: fmt(twoDaysAgo), startTime: '14:00', endTime: '15:00', category: 'Education', description: 'Interaction Design Workshop', durationMinutes: 60, balanceHours: bh('Education', 60) },
  ];
}
