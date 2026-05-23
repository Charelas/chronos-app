/**
 * utils/gemini.ts
 *
 * Apa yang dilakukan AI di sini?
 * ─────────────────────────────
 * Setiap minggu, AI membaca data produktivitas user (jam kerja, balance, hari paling produktif,
 * kategori dominan, tren vs minggu lalu) dan menghasilkan satu "Balance Insight" — kalimat
 * singkat yang personal, tenang, dan actionable, seperti seorang productivity coach.
 *
 * Contoh output: "You're 87% through your 40h target with a +2.3h surplus.
 * Wednesday was your sharpest day — consider anchoring deep work there next week."
 *
 * Jika API gagal (tidak ada key, offline, rate limit), fungsi ini otomatis fallback ke
 * rule-based engine yang menghasilkan insight berdasarkan kondisi data — selalu berfungsi.
 *
 * Cache strategy:
 * - Disimpan ke AsyncStorage (bertahan meski app restart / Expo reload)
 * - TTL: 2 jam
 * - Invalidated kalau weeklyHours atau totalBalance berubah ≥ 0.1h
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

// gemini-1.5-flash: stabil, gratis, JSON mode supported, RPM lebih tinggi dari 2.0-flash
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const CACHE_KEY = '@chronos_ai_insight_cache';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 jam — tidak perlu fetch ulang kecuali data berubah

export type InsightInput = {
  userName: string;
  weeklyHours: number;
  weeklyCommitment: number;
  totalBalance: number;
  peakDay: string;
  peakDayHours: number;
  topCategory: string;
  prevWeekHours: number;
};

export type AIInsight = {
  headline: string;
  body: string;
  mood: 'positive' | 'neutral' | 'warning';
  source: 'ai' | 'rule';
};

type CachePayload = {
  insight: AIInsight;
  cachedAt: number;
  weeklyHoursSnapshot: number;
  totalBalanceSnapshot: number;
};

// ─── AsyncStorage cache helpers ───────────────────────────────────────────────

async function loadCache(): Promise<CachePayload | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachePayload) : null;
  } catch {
    return null;
  }
}

async function saveCache(payload: CachePayload): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // silently ignore storage errors
  }
}

async function isCacheValid(input: InsightInput): Promise<CachePayload | null> {
  const cached = await loadCache();
  if (!cached) return null;

  const age = Date.now() - cached.cachedAt;
  if (age > CACHE_TTL_MS) return null;

  const hoursChanged = Math.abs(cached.weeklyHoursSnapshot - input.weeklyHours) >= 0.1;
  const balanceChanged = Math.abs(cached.totalBalanceSnapshot - input.totalBalance) >= 0.1;
  if (hoursChanged || balanceChanged) return null;

  return cached;
}

// ─── Rule-based fallback ──────────────────────────────────────────────────────

function buildRuleInsight(input: InsightInput): AIInsight {
  const { weeklyHours, weeklyCommitment, totalBalance, peakDay, peakDayHours } = input;
  const pct = weeklyCommitment > 0 ? weeklyHours / weeklyCommitment : 0;

  if (totalBalance < -4) {
    return {
      headline: 'Balance Warning',
      body: `Your time balance is at ${totalBalance.toFixed(1)}h. You've been investing heavily in personal time — consider logging more focused work sessions to restore equilibrium.`,
      mood: 'warning',
      source: 'rule',
    };
  }
  if (pct >= 1) {
    return {
      headline: 'Weekly Target Achieved',
      body: `You've hit your ${weeklyCommitment}h weekly target. Your most productive day was ${peakDay} at ${peakDayHours.toFixed(1)}h. Consider scheduling lighter tasks for the rest of the week.`,
      mood: 'positive',
      source: 'rule',
    };
  }
  if (peakDayHours > 6) {
    return {
      headline: `Focus Peak: ${peakDay}`,
      body: `Your productivity peaks on ${peakDay}s (${peakDayHours.toFixed(1)}h). Schedule your highest-complexity tasks during this window for maximum output.`,
      mood: 'positive',
      source: 'rule',
    };
  }
  if (weeklyHours < weeklyCommitment * 0.3 && weeklyHours >= 0) {
    return {
      headline: 'Slow Start This Week',
      body: `You've logged ${weeklyHours.toFixed(1)}h of your ${weeklyCommitment}h weekly goal. There's still time — consider starting a focus session now.`,
      mood: 'neutral',
      source: 'rule',
    };
  }
  return {
    headline: 'Steady Cadence',
    body: `You're ${Math.round(pct * 100)}% through your weekly goal with a ${totalBalance >= 0 ? 'positive' : 'negative'} balance of ${totalBalance.toFixed(1)}h. Stay consistent and finish strong.`,
    mood: totalBalance >= 0 ? 'positive' : 'neutral',
    source: 'rule',
  };
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(input: InsightInput): string {
  const {
    userName, weeklyHours, weeklyCommitment,
    totalBalance, peakDay, peakDayHours, topCategory, prevWeekHours,
  } = input;

  const trend = prevWeekHours > 0
    ? weeklyHours > prevWeekHours
      ? `${Math.round(((weeklyHours - prevWeekHours) / prevWeekHours) * 100)}% more`
      : `${Math.round(((prevWeekHours - weeklyHours) / prevWeekHours) * 100)}% less`
    : 'no comparison data';

  // Note: NO responseMimeType used — we ask Gemini to return JSON in the prompt itself
  return `You are a calm, intelligent productivity coach for a mobile time-tracking app called "Chronos Balance."
The app philosophy is "The Balanced Chronograph" — architectural calm, not aggressive productivity.

User data this week:
- Name: ${userName || 'the user'}
- Hours logged: ${weeklyHours.toFixed(1)}h of ${weeklyCommitment}h weekly target
- Total time balance: ${totalBalance.toFixed(1)}h (positive = work surplus, negative = personal time surplus)
- Peak day: ${peakDay} (${peakDayHours.toFixed(1)}h)
- Most common category: ${topCategory}
- Compared to last week: ${trend} hours

Respond with ONLY a JSON object — no markdown fences, no explanation, just raw JSON:
{"headline":"3-5 word title","body":"1-2 sentences, personal and calm, reference specific numbers, no exclamation marks","mood":"positive"}

mood must be exactly one of: "positive", "neutral", "warning"
- "warning" if balance < -4h or weekly hours > 60h
- "positive" if on track or exceeding target
- "neutral" otherwise`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function getBalanceInsight(input: InsightInput): Promise<AIInsight> {
  if (!GEMINI_API_KEY) {
    return buildRuleInsight(input);
  }

  // Return cached insight if still valid
  const cached = await isCacheValid(input);
  if (cached) {
    return cached.insight;
  }

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(input) }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
          // No responseMimeType — not supported by all models, causes 400
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`Gemini API ${response.status}: ${errBody.slice(0, 120)}`);
    }

    const data = await response.json();
    const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Strip possible markdown code fences before parsing
    const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.headline || !parsed.body || !parsed.mood) {
      throw new Error('Invalid Gemini response shape');
    }

    const insight: AIInsight = {
      headline: parsed.headline,
      body: parsed.body,
      mood: parsed.mood as AIInsight['mood'],
      source: 'ai',
    };

    await saveCache({
      insight,
      cachedAt: Date.now(),
      weeklyHoursSnapshot: input.weeklyHours,
      totalBalanceSnapshot: input.totalBalance,
    });

    return insight;
  } catch (err) {
    if (__DEV__) console.warn('🤖 [Gemini] Falling back to rule-based insight:', err);

    const fallback = buildRuleInsight(input);
    // Cache fallback with shorter TTL (30 min) so it retries sooner
    await saveCache({
      insight: fallback,
      cachedAt: Date.now() - (CACHE_TTL_MS - 30 * 60 * 1000),
      weeklyHoursSnapshot: input.weeklyHours,
      totalBalanceSnapshot: input.totalBalance,
    });

    return fallback;
  }
}

/**
 * Invalidate the persisted insight cache.
 * Call after any data change (add/delete entry, stop timer) so the next
 * Analytics visit fetches a fresh AI insight.
 */
export async function invalidateInsightCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch {
    // silently ignore
  }
}
