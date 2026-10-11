// lib/ai-question.ts
import { nowIST } from './countdown';

export interface GeneratedQuestion {
  intro?: string;
  question: string;
  options: string[];
  source: 'gemini' | 'grok' | 'curated';
}

// Fallback curated questions for couples (designed for Vansh & Pakhi)
export const CURATED_DAILY_QUESTIONS: GeneratedQuestion[] = [
  {
    intro: 'A cozy thought for our little world.',
    question: 'If we had one completely free evening together, what sounds sweetest?',
    options: ['Ice cream walk under the stars 🍦✨', 'Cozy movie night tucked in a blanket 🍿🎬'],
    source: 'curated',
  },
  {
    intro: 'Imagine our next morning together.',
    question: 'How should we start our ideal weekend morning?',
    options: ['Catching the early golden sunrise 🌅', 'Sleeping in & talking softly until noon 🌙🛌'],
    source: 'curated',
  },
  {
    intro: 'A little romance for today.',
    question: 'Which surprise makes your heart flutter faster?',
    options: ['A surprise bouquet of fresh flowers 💐', 'A handwritten letter sealed with love 💌'],
    source: 'curated',
  },
  {
    intro: 'Planning our little escapes.',
    question: 'If we could teleport for an afternoon date right now, where to?',
    options: ['A sunny beach with cool ocean waves 🏖️🌊', 'A misty mountain cabin with hot tea ⛰️☕'],
    source: 'curated',
  },
  {
    intro: 'Dinner thoughts for us.',
    question: 'What sounds like the most fun dinner date?',
    options: ['Messy cooking pasta together at home 🍳🍝', 'Exploring street food stalls hand in hand 🍕🥟'],
    source: 'curated',
  },
  {
    intro: 'A little garden imagination.',
    question: 'What kind of magic should our garden sprout today?',
    options: ['Glowing twilight fireflies 🌟🌿', 'A patch of miniature sweet strawberries 🍓🌷'],
    source: 'curated',
  },
  {
    intro: 'Just thinking about your smile.',
    question: 'Which shared moment are you looking forward to most?',
    options: ['A long quiet hug at the airport / station 🤍🫂', 'Laughing until our stomachs hurt in person 😂🥰'],
    source: 'curated',
  },
];

/**
 * Gets today's date formatted as YYYY-MM-DD in IST timezone.
 */
export function getTodayDateIST(): string {
  const ist = nowIST();
  const year = ist.getFullYear();
  const month = String(ist.getMonth() + 1).padStart(2, '0');
  const day = String(ist.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safe text cleaner to prevent HTML injection and excessive length
 */
function cleanText(text: unknown, maxLen = 140): string {
  if (typeof text !== 'string') return '';
  return text.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

/**
 * Generates today's question using Gemini API, Grok API, or Curated fallback
 */
export async function generateDailyQuestion(): Promise<GeneratedQuestion> {
  const grokKey = process.env.XAI_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  const prompt = `You are a sweet, gentle, romantic AI assistant for a loving couple (Vansh and Pakhi) who have been together for 5-6 years and are counting down the days until they meet again.
Generate ONE short, warm, cozy choice question for today with 2 or 3 charming options.
Rules:
- Strictly NO memory tests, quizzes, or trivia (never ask what someone's favorite thing is).
- Strictly NO compatibility evaluation, scoring, or judgment.
- Keep it lighthearted, playful, romantic, or about sweet moments and dates.
- Keep question under 18 words.
- Options must be concise (under 8 words each) with an emoji.
- Return ONLY valid JSON in this exact structure:
{
  "intro": "A tiny warm intro (under 10 words)",
  "question": "The question here?",
  "options": ["Option 1", "Option 2"]
}`;

  // 1. Try xAI / Grok API first if XAI_API_KEY is configured
  if (grokKey && !grokKey.startsWith('AQ.')) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6500);

      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${grokKey}`,
        },
        body: JSON.stringify({
          model: 'grok-2-latest',
          messages: [
            {
              role: 'system',
              content: 'You are a warm relationship companion. Always respond with raw valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.8,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.choices?.[0]?.message?.content;
        if (rawText) {
          const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          const question = cleanText(parsed.question, 160);
          const intro = cleanText(parsed.intro, 80);
          const options = Array.isArray(parsed.options)
            ? parsed.options.map((opt: unknown) => cleanText(opt, 60)).filter(Boolean).slice(0, 3)
            : [];

          if (question && options.length >= 2) {
            return {
              intro: intro || 'A tiny moment for us 💗',
              question,
              options,
              source: 'grok',
            };
          }
        }
      }
    } catch {
      // Fall through to Gemini or fallback
    }
  }

  // 2. Try Gemini API if key is present
  const actualGeminiKey = geminiKey || (grokKey?.startsWith('AQ.') ? grokKey : '');
  if (actualGeminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${actualGeminiKey}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6500);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.8,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          const question = cleanText(parsed.question, 160);
          const intro = cleanText(parsed.intro, 80);
          const options = Array.isArray(parsed.options)
            ? parsed.options.map((opt: unknown) => cleanText(opt, 60)).filter(Boolean).slice(0, 3)
            : [];

          if (question && options.length >= 2) {
            return {
              intro: intro || 'A tiny moment for us 💗',
              question,
              options,
              source: 'gemini',
            };
          }
        }
      }
    } catch {
      // Fall through to curated fallback
    }
  }

  // 3. Reliable, curated seasonal fallback (deterministic by day of year so it rotates daily)
  const dayOfYear = Math.floor(
    (nowIST().getTime() - new Date(nowIST().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const fallback = CURATED_DAILY_QUESTIONS[dayOfYear % CURATED_DAILY_QUESTIONS.length];
  return {
    ...fallback,
    source: 'curated',
  };
}
