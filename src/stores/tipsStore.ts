import { create } from 'zustand';
import { AppConstants } from '../constants';
import { HealthTip } from '../types';
import { useActivityStore } from './activityStore';

const FALLBACK_TIPS: Omit<HealthTip, 'id' | 'isRead' | 'createdAt'>[] = [
  {
    title: 'Stay hydrated',
    content: 'Aim for about 2 litres of water a day. Sip regularly instead of drinking a lot at once.',
    category: 'nutrition',
    priority: 'high',
  },
  {
    title: 'Take a short walk',
    content: 'A 10–15 minute walk after meals can help energy, mood, and digestion.',
    category: 'fitness',
    priority: 'medium',
  },
  {
    title: 'Protect your sleep',
    content: 'Keep a consistent bedtime and avoid screens for 30 minutes before sleep when you can.',
    category: 'wellness',
    priority: 'high',
  },
  {
    title: 'Mindful break',
    content: 'Pause for one minute of slow breathing when you feel stressed — inhale 4, hold 4, exhale 6.',
    category: 'mental-health',
    priority: 'medium',
  },
];

/** Retired 2.x Flash models return "no longer available". Use current 3.6 Flash only. */
const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash'];
const GEMINI_TIMEOUT_MS = 25000;

interface TipsState {
  tips: HealthTip[];
  isLoading: boolean;
  error: string | null;
  fetchTips: () => Promise<void>;
  generatePersonalizedTip: () => Promise<HealthTip | null>;
  markTipAsRead: (tipId: string) => void;
}

function makeTip(
  partial: Omit<HealthTip, 'id' | 'isRead' | 'createdAt'>,
  id?: string
): HealthTip {
  return {
    ...partial,
    id: id ?? `tip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    isRead: false,
    createdAt: new Date(),
  };
}

function titleKey(title: string): string {
  return title.trim().toLowerCase();
}

function prependUnique(tip: HealthTip, existing: HealthTip[]): HealthTip[] {
  return [tip, ...existing.filter((t) => titleKey(t.title) !== titleKey(tip.title))];
}

function parseTipJson(raw: string): { title: string; content: string; category?: HealthTip['category'] } {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const jsonText = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try {
    return JSON.parse(jsonText);
  } catch {
    return { title: 'Your tip', content: cleaned.slice(0, 180) || 'Try generating again.', category: 'general' };
  }
}

async function generateWithGemini(apiKey: string, prompt: string): Promise<string> {
  let lastError = 'Gemini request failed';
  for (const model of GEMINI_MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 256,
              responseMimeType: 'application/json',
              thinkingConfig: { thinkingLevel: 'minimal' },
            },
          }),
        }
      );
      const json = (await res.json()) as {
        error?: { message?: string; status?: string };
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      if (!res.ok) {
        lastError = json.error?.message || `Gemini HTTP ${res.status}`;
        const retired =
          res.status === 404 || /no longer available|not found|not supported/i.test(lastError);
        if (retired) continue;
        throw new Error(lastError);
      }
      const text =
        json.candidates?.[0]?.content?.parts
          ?.filter((p) => !('thought' in p && (p as { thought?: boolean }).thought))
          .map((p) => p.text || '')
          .join('')
          .trim() ?? '';
      if (text) return text;
      lastError = 'Gemini returned an empty tip';
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        lastError = 'Gemini timed out';
        continue;
      }
      throw e instanceof Error ? e : new Error(lastError);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(lastError);
}

export const useTipsStore = create<TipsState>((set, get) => ({
  tips: [],
  isLoading: false,
  error: null,

  fetchTips: async () => {
    const current = get().tips;
    if (current.length) {
      const seen = new Set<string>();
      const unique = current.filter((t) => {
        const key = titleKey(t.title);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (unique.length !== current.length) set({ tips: unique });
      return;
    }
    const tips = FALLBACK_TIPS.map((t, i) => makeTip(t, `fallback-${i}`));
    set({ tips, isLoading: false, error: null });
  },

  generatePersonalizedTip: async () => {
    set({ isLoading: true, error: null });
    const activity = useActivityStore.getState().todayActivity;
    const steps = activity?.steps ?? 0;
    const water = activity?.waterIntake ?? 0;
    const apiKey = AppConstants.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
      try {
        const existingTitles = get()
          .tips.map((t) => t.title)
          .slice(0, 8)
          .join(', ');
        const mood = activity?.mood ? `, mood ${activity.mood}` : '';
        const prompt = `You are a friendly health coach. User today: ${steps} steps, ${water}ml water${mood}. Give ONE short unique health tip (title under 6 words, body under 40 words). Do not reuse these titles: ${existingTitles || 'Stay hydrated'}. Reply as JSON only: {"title":"...","content":"...","category":"fitness|nutrition|wellness|mental-health|general"}`;
        const text = await generateWithGemini(apiKey, prompt);
        const parsed = parseTipJson(text);
        const tip = makeTip(
          {
            title: parsed.title || 'Your tip',
            content: parsed.content || text,
            category: parsed.category || 'general',
            priority: 'medium',
          },
          `gemini-${Date.now()}`
        );
        set({ tips: prependUnique(tip, get().tips), isLoading: false, error: null });
        return tip;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Gemini failed';
        console.warn('[Tips] Gemini failed:', message);
        set({ isLoading: false, error: message });
        return null;
      }
    }

    const base =
      water < 1000
        ? FALLBACK_TIPS[0]
        : steps < 3000
          ? FALLBACK_TIPS[1]
          : FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
    const tip = makeTip({
      ...base,
      title: base.title,
      content: `${base.content} (Based on today: ${steps} steps, ${water}ml water.)`,
    });
    set({
      tips: prependUnique(tip, get().tips),
      isLoading: false,
      error: 'No Gemini API key — showing a saved tip.',
    });
    return tip;
  },

  markTipAsRead: (tipId) => {
    set({
      tips: get().tips.map((t) => (t.id === tipId ? { ...t, isRead: true } : t)),
    });
  },
}));
