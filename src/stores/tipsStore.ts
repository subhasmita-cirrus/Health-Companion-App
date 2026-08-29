import { create } from 'zustand';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

export const useTipsStore = create<TipsState>((set, get) => ({
  tips: [],
  isLoading: false,
  error: null,

  fetchTips: async () => {
    set({ isLoading: true, error: null });
    const tips = FALLBACK_TIPS.map((t, i) => makeTip(t, `fallback-${i}`));
    set({ tips, isLoading: false });
  },

  generatePersonalizedTip: async () => {
    set({ isLoading: true, error: null });
    const activity = useActivityStore.getState().todayActivity;
    const steps = activity?.steps ?? 0;
    const water = activity?.waterIntake ?? 0;

    const apiKey = AppConstants.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are a friendly health coach. User today: ${steps} steps, ${water}ml water. Give ONE short health tip (title under 6 words, body under 40 words). Reply as JSON only: {"title":"...","content":"...","category":"fitness|nutrition|wellness|mental-health|general"}`;
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(text) as {
          title: string;
          content: string;
          category?: HealthTip['category'];
        };
        const tip = makeTip({
          title: parsed.title || 'Your tip',
          content: parsed.content || text,
          category: parsed.category || 'general',
          priority: 'medium',
        });
        set({ tips: [tip, ...get().tips], isLoading: false });
        return tip;
      } catch (e) {
        console.warn('[Tips] Gemini failed, using fallback:', e instanceof Error ? e.message : e);
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
    set({ tips: [tip, ...get().tips], isLoading: false });
    return tip;
  },

  markTipAsRead: (tipId) => {
    set({
      tips: get().tips.map((t) => (t.id === tipId ? { ...t, isRead: true } : t)),
    });
  },
}));
