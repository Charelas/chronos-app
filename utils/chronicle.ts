/**
 * utils/chronicle.ts
 *
 * Weekly Chronicle AI feature — generates an editorial narrative paragraph
 * summarising the week's time data using Gemini 2.5 Flash.
 *
 * Completely standalone — no cross-dependency with gemini.ts.
 * ChronicleInput type lives in utils/storage.ts.
 */

import type { ChronicleInput } from './storage';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(input: ChronicleInput): string {
  const {
    weekLabel, totalHours, activeDays, totalEntries,
    peakDay, peakDayHours, weeklyTarget, finalBalance,
    topCategory, categoryBreakdown,
  } = input;

  const pct = weeklyTarget > 0 ? Math.round((totalHours / weeklyTarget) * 100) : 0;
  const breakdownStr = categoryBreakdown
    .filter(c => c.pct > 0)
    .map(c => `${c.name} ${c.pct}%`)
    .join(', ');
  const balanceSign = finalBalance >= 0 ? `+${finalBalance.toFixed(1)}` : finalBalance.toFixed(1);

  return `You are the editorial voice of "Chronos Balance," a time-tracking app with the design philosophy of "The Balanced Chronograph." Your tone is calm, reflective, and literary — like a thoughtful journal entry, not a business report.

Write a 2-3 sentence narrative summary of this specific week in third person. Reference concrete numbers. Do not use "you" or "your." Do not use exclamation marks. Make it feel like an editorial chronicle — precise, elegant, and personal.

Week: ${weekLabel}
- Hours logged: ${totalHours.toFixed(1)}h of ${weeklyTarget}h target (${pct}%)
- Active days: ${activeDays} days, ${totalEntries} sessions
- Peak day: ${peakDay} (${peakDayHours.toFixed(1)}h)
- Category breakdown: ${breakdownStr}
- Dominant focus: ${topCategory}
- Closing balance: ${balanceSign}h

Respond with ONLY the narrative paragraph — no title, no JSON, no quotes, no explanation.`;
}

// ─── Rule-based fallback ──────────────────────────────────────────────────────

function buildRuleBased(input: ChronicleInput): string {
  const {
    weekLabel, totalHours, activeDays, totalEntries,
    peakDay, peakDayHours, weeklyTarget, finalBalance, topCategory,
  } = input;
  const pct = weeklyTarget > 0 ? Math.round((totalHours / weeklyTarget) * 100) : 0;
  const balanceDesc =
    finalBalance > 2 ? 'a strong positive surplus'
    : finalBalance > 0 ? 'a modest positive balance'
    : finalBalance > -2 ? 'a near-neutral equilibrium'
    : 'a notable deficit';

  return `${weekLabel} was a week defined by ${topCategory.toLowerCase()} work, spanning ${activeDays} active days and ${totalEntries} logged sessions. At ${totalHours.toFixed(1)} hours — ${pct}% of the ${weeklyTarget}h target — ${peakDay} emerged as the defining day with ${peakDayHours.toFixed(1)} hours of focused output. The week closed at ${balanceDesc} of ${finalBalance >= 0 ? '+' : ''}${finalBalance.toFixed(1)}h, a precise record of the week's temporal architecture.`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Generate an editorial narrative for the week.
 * Falls back to rule-based text if Gemini is unavailable.
 */
export async function getWeeklyChronicle(
  input: ChronicleInput,
): Promise<{ narrative: string; source: 'ai' | 'rule' }> {
  if (!GEMINI_API_KEY) {
    return { narrative: buildRuleBased(input), source: 'rule' };
  }

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(input) }] }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 300,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`Gemini API ${response.status}: ${errBody.slice(0, 80)}`);
    }

    const data = await response.json();
    const narrative: string = (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    ).trim();

    if (!narrative || narrative.length < 20) {
      throw new Error('Empty chronicle response');
    }

    return { narrative, source: 'ai' };
  } catch (err) {
    if (__DEV__) console.warn('📖 [Chronicle] Falling back to rule-based:', err);
    return { narrative: buildRuleBased(input), source: 'rule' };
  }
}
