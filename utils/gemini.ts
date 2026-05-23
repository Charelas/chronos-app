/**
 * utils/gemini.ts
 * AI-powered balance insights using Google Gemini API.
 * Falls back to rule-based insights if API key is missing or request fails.
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

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
  headline: string;   // short punchy title, e.g. "Peak Performance Wednesday"
  body: string;       // 1-2 sentence actionable insight
  mood: 'positive' | 'neutral' | 'warning'; // drives card color
  source: 'ai' | 'rule'; // 'ai' = Gemini, 'rule' = fallback
};

// ---------- Rule-based fallback ----------

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
      body: `You've hit your ${weeklyCommitment}h weekly target! Your most productive day was ${peakDay} at ${peakDayHours.toFixed(1)}h. Consider scheduling lighter tasks for the rest of the week.`,
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

// ---------- Gemini prompt builder ----------

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

  return `You are a calm, intelligent productivity coach for a mobile time-tracking app called "Chronos Balance." 
The app philosophy is "The Balanced Chronograph" — architectural calm, not aggressive productivity.

User data this week:
- Name: ${userName || 'the user'}
- Hours logged: ${weeklyHours.toFixed(1)}h of ${weeklyCommitment}h weekly target
- Total time balance: ${totalBalance.toFixed(1)}h (positive = work surplus, negative = personal time surplus)
- Peak day: ${peakDay} (${peakDayHours.toFixed(1)}h)
- Most common category: ${topCategory}
- Compared to last week: ${trend} hours

Generate a JSON object with exactly these fields:
{
  "headline": "3-5 word punchy title (no quotes, no emoji)",
  "body": "1-2 sentences. Personal, calm, actionable. Reference specific numbers. Do not use exclamation marks.",
  "mood": "positive" or "neutral" or "warning"
}

Rules:
- mood is "warning" only if balance < -4h or hours are dangerously high (>60h/week)
- mood is "positive" if on track or exceeding target
- mood is "neutral" otherwise
- Respond ONLY with the JSON object, no markdown, no explanation.`;
}

// ---------- Main export ----------

export async function getBalanceInsight(input: InsightInput): Promise<AIInsight> {
  // No API key → use rule-based immediately
  if (!GEMINI_API_KEY) {
    return buildRuleInsight(input);
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
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) throw new Error(`Gemini API ${response.status}`);

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const parsed = JSON.parse(text);

    if (!parsed.headline || !parsed.body || !parsed.mood) throw new Error('Invalid Gemini response shape');

    return {
      headline: parsed.headline,
      body: parsed.body,
      mood: parsed.mood as AIInsight['mood'],
      source: 'ai',
    };
  } catch (err) {
    if (__DEV__) console.warn('🤖 [Gemini] Falling back to rule-based insight:', err);
    return buildRuleInsight(input);
  }
}
