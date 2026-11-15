import { storage } from './storage';
import { Milestone } from '../types';

export interface MentorContext {
  focusScore: number;
  activeGoalsCount: number;
  topGoalTitle?: string;
  todayTasksRemaining: number;
  focusMinutesToday: number;
  userName: string;
  hasApiKey?: boolean;
}

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

let cachedWorkingModel: string | null = null;

// Fetch helper with timeout
async function fetchDirect(url: string, options: RequestInit = {}, timeoutMs: number = 12000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return res;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out after 12 seconds. Check network or DNS.');
    }
    throw err;
  }
}

export const aiService = {
  cleanKey(key: string): string {
    return key.trim().replace(/^["']|["']$/g, '');
  },

  // Discover actual valid generation models from Google's ListModels, prioritizing Gemini flagships
  async getAvailableModels(key: string): Promise<string[]> {
    try {
      const res = await fetchDirect(`${BASE_URL}/models?key=${key}`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        const models: Array<{ name: string; supportedGenerationMethods?: string[] }> = data.models || [];
        
        const valid = models
          .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m) => m.name.replace(/^models\//, ''))
          // Filter out deprecated, embedding, or text-only models
          .filter((name) => !name.includes('2.5') && !name.includes('embedding') && !name.includes('aqa'));

        // Rank models: Gemini Flash > Gemini Pro > Others (Gemma)
        valid.sort((a, b) => {
          const aIsGemini = a.startsWith('gemini');
          const bIsGemini = b.startsWith('gemini');
          if (aIsGemini && !bIsGemini) return -1;
          if (!aIsGemini && bIsGemini) return 1;

          const aIsFlash = a.includes('flash');
          const bIsFlash = b.includes('flash');
          if (aIsFlash && !bIsFlash) return -1;
          if (!aIsFlash && bIsFlash) return 1;

          return 0;
        });

        if (valid.length > 0) {
          return valid;
        }
      }
    } catch (e) {
      console.warn('ListModels call failed:', e);
    }
    return ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-3.8-flash'];
  },

  async testApiKey(rawKey: string): Promise<{ success: boolean; message: string; model?: string }> {
    const key = this.cleanKey(rawKey);
    if (!key) {
      return { success: false, message: 'Please enter an API key first.' };
    }

    cachedWorkingModel = null;
    const availableModels = await this.getAvailableModels(key);

    let lastError = '';

    for (const model of availableModels) {
      try {
        const url = `${BASE_URL}/models/${model}:generateContent?key=${key}`;
        const res = await fetchDirect(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with exactly: CONNECTED' }] }],
          }),
        });

        if (res.ok) {
          cachedWorkingModel = model;
          return {
            success: true,
            message: `Connected successfully! (${model} is live and responding)`,
            model,
          };
        }

        const data = await res.json();
        const msg = data.error?.message || `HTTP ${res.status}`;

        // If high demand, internal error, or unsupported, try next model
        if (
          res.status === 500 ||
          res.status === 503 ||
          res.status === 429 ||
          res.status === 404 ||
          msg.toLowerCase().includes('internal error') ||
          msg.toLowerCase().includes('high demand') ||
          msg.toLowerCase().includes('overloaded')
        ) {
          lastError = `${model}: ${msg}`;
          continue;
        }

        return {
          success: false,
          message: `Google API: ${msg}`,
        };
      } catch (err: any) {
        lastError = err.message || 'Request failed';
      }
    }

    return {
      success: false,
      message: `Google reported: ${lastError || 'Temporary server load. Please retry.'}`,
    };
  },

  async chatWithMentor(userMessage: string, context: MentorContext): Promise<string> {
    const settings = storage.getSettings();
    const rawKey = settings.geminiApiKey?.trim();

    if (rawKey) {
      const key = this.cleanKey(rawKey);
      const availableModels = await this.getAvailableModels(key);
      const modelsToTry = cachedWorkingModel
        ? [cachedWorkingModel, ...availableModels.filter((m) => m !== cachedWorkingModel)]
        : availableModels;

      const systemPrompt = `You are FocusPilot Mentor, a world-class executive performance coach and cognitive strategist.
User Profile:
- Name: ${context.userName}
- Current Focus Score: ${context.focusScore}/100
- Deep Work Minutes Logged Today: ${context.focusMinutesToday} mins
- Remaining Tasks Today: ${context.todayTasksRemaining}
- Primary Active Goal: ${context.topGoalTitle || 'General Mastery'}

Style & Tone:
- Sharp, stoic, disciplined, highly actionable, concise.
- Keep responses to 2-3 punchy paragraphs or bullet points.
- Prioritize high-leverage execution.`;

      const promptPayload = `${systemPrompt}\n\nUser Question:\n"${userMessage}"\n\nDirect Coach Response:`;

      for (const model of modelsToTry) {
        try {
          const url = `${BASE_URL}/models/${model}:generateContent?key=${key}`;
          const res = await fetchDirect(
            url,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptPayload }] }],
              }),
            },
            15000
          );

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              cachedWorkingModel = model;
              return `${text.trim()}\n\n—\n⚡ *Response via Google Gemini (${model})*`;
            }
          }

          const err = await res.json();
          const msg = err.error?.message || '';

          // If internal error, high demand, or rate limited, cascade to next model!
          if (
            res.status === 500 ||
            res.status === 503 ||
            res.status === 429 ||
            res.status === 404 ||
            msg.toLowerCase().includes('internal error') ||
            msg.toLowerCase().includes('high demand') ||
            msg.toLowerCase().includes('overloaded')
          ) {
            continue;
          }

          return `⚠️ **Gemini API Error:** ${msg || res.statusText}`;
        } catch {
          // try next model
        }
      }

      return '⚠️ **Google Server Busy:** Model temporarily reported an internal error. Please try sending your message again.';
    }

    // Smart Local Fallback Coach (Works 100% offline or when no API key is provided)
    const lower = userMessage.toLowerCase();

    if (lower.includes('procrastinat') || lower.includes('lazy') || lower.includes('hard to start')) {
      return `Procrastination is rarely about laziness—it is emotional friction against uncertainty or overwhelm.

**The FocusPilot Protocol:**
1. **The 5-Minute Rule:** Commit to working on your top task for exactly 5 minutes without touching your phone. Action precedes motivation.
2. **Reduce Scope:** What is the micro-step? If it's writing code, open the editor and write 3 lines.
3. **Trigger Deep Work:** Start a 25-minute Pomodoro in the Focus Timer right now. Your attention is your only asset.

—
*Offline Coach Mode*`;
    }

    if (lower.includes('review') || lower.includes('how did i do') || lower.includes('today')) {
      return `### Daily Tactical Debrief:
- **Focus Score:** ${context.focusScore}/100
- **Deep Work Clocked:** ${context.focusMinutesToday} minutes
- **Unfinished Priorities:** ${context.todayTasksRemaining} items remaining

${
  context.focusScore >= 70
    ? 'Solid operational discipline today. You protected your attention and delivered real velocity.'
    : 'Momentum was fragmented today. Identify what pulled you away from deep work and eliminate that friction tomorrow morning.'
}

**Next Move:** Complete the evening reflection in your Journal, close today's loops, and protect 8 hours of restorative sleep.

—
*Offline Coach Mode*`;
    }

    return `I am analyzing your metrics. Your Focus Score currently stands at **${context.focusScore}/100** with **${context.focusMinutesToday} minutes** of locked-in focus today.

To build compound momentum:
- Protect your highest-priority task before noon.
- Use the Focus Timer with 40Hz binaural audio to enter high-alpha state quickly.
- What specific bottleneck is standing in your way right now?

—
*Offline Coach Mode*`;
  },

  async breakdownGoal(goalTitle: string, category: string, description: string): Promise<Milestone[]> {
    const settings = storage.getSettings();
    const rawKey = settings.geminiApiKey?.trim();

    if (rawKey) {
      const key = this.cleanKey(rawKey);
      const availableModels = await this.getAvailableModels(key);
      const modelsToTry = cachedWorkingModel
        ? [cachedWorkingModel, ...availableModels.filter((m) => m !== cachedWorkingModel)]
        : availableModels;

      const prompt = `Break down this long-term goal into 4 concrete, sequential, highly achievable milestones with measurable outcomes.
Goal: "${goalTitle}"
Category: "${category}"
Description: "${description}"

Return ONLY valid JSON matching this schema:
[
  { "id": "m1", "title": "Milestone title with metric", "completed": false }
]`;

      for (const model of modelsToTry) {
        try {
          const url = `${BASE_URL}/models/${model}:generateContent?key=${key}`;
          const res = await fetchDirect(
            url,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
            },
            15000
          );

          if (res.ok) {
            const data = await res.json();
            let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(rawText);
            if (Array.isArray(parsed) && parsed.length > 0) {
              cachedWorkingModel = model;
              return parsed.map((m, idx) => ({
                id: `m_${Date.now()}_${idx}`,
                title: m.title || `Milestone ${idx + 1}`,
                completed: false,
              }));
            }
          }
        } catch {
          // try next model
        }
      }
    }

    // Offline / Instant Fallback breakdown
    const now = Date.now();
    return [
      { id: `m_${now}_1`, title: `Foundation: Research & define scope for "${goalTitle.slice(0, 30)}"`, completed: false },
      { id: `m_${now}_2`, title: 'MVP / Initial Blueprint: Execute initial prototype or first phase', completed: false },
      { id: `m_${now}_3`, title: 'Consistency Sprint: 14 continuous days of dedicated daily effort', completed: false },
      { id: `m_${now}_4`, title: 'Mastery & Final Delivery: Full review, polish, and completion', completed: false },
    ];
  },
};
