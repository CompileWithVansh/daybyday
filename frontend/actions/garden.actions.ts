'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { generateDailyQuestion, getTodayDateIST } from '@/lib/ai-question';

export interface GardenData {
  waterCount: number;
  lastWateredAt: string;
  lastWateredBy: string | null;
  vanshMood: string | null;
  pakhiMood: string | null;
  vanshMoodAt: string | null;
  pakhiMoodAt: string | null;
  currentPromptId: number;
  vanshChoice: string | null;
  pakhiChoice: string | null;
  currentUserName: string;
}

export interface GardenActionResult {
  success: boolean;
  error?: string;
  data?: GardenData;
}

const DEFAULT_GARDEN_DATA: GardenData = {
  waterCount: 5,
  lastWateredAt: new Date().toISOString(),
  lastWateredBy: null,
  vanshMood: 'Amazing 🌸',
  pakhiMood: 'Doing okay 🌿',
  vanshMoodAt: new Date().toISOString(),
  pakhiMoodAt: new Date().toISOString(),
  currentPromptId: 1,
  vanshChoice: null,
  pakhiChoice: null,
  currentUserName: 'Love',
};

/**
 * Helper to ensure a GardenState row exists in the database
 */
async function getOrCreateGardenRow() {
  try {
    const existing = await (prisma as any).gardenState?.findFirst({
      orderBy: { id: 'asc' },
    });
    if (existing) return existing;

    return await (prisma as any).gardenState?.create({
      data: {
        waterCount: 5,
        lastWateredAt: new Date(),
        currentPromptId: 1,
      },
    });
  } catch {
    return null;
  }
}

/**
 * Get current shared Garden state
 */
export async function getGardenState(): Promise<GardenActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const row = await getOrCreateGardenRow();
    if (!row) {
      return {
        success: true,
        data: {
          ...DEFAULT_GARDEN_DATA,
          currentUserName: user.displayName || user.username,
        },
      };
    }

    return {
      success: true,
      data: {
        waterCount: row.waterCount ?? 5,
        lastWateredAt: row.lastWateredAt?.toISOString() ?? new Date().toISOString(),
        lastWateredBy: row.lastWateredBy ?? null,
        vanshMood: row.vanshMood ?? null,
        pakhiMood: row.pakhiMood ?? null,
        vanshMoodAt: row.vanshMoodAt?.toISOString() ?? null,
        pakhiMoodAt: row.pakhiMoodAt?.toISOString() ?? null,
        currentPromptId: row.currentPromptId ?? 1,
        vanshChoice: row.vanshChoice ?? null,
        pakhiChoice: row.pakhiChoice ?? null,
        currentUserName: user.displayName || user.username,
      },
    };
  } catch (error) {
    return {
      success: true,
      data: {
        ...DEFAULT_GARDEN_DATA,
        currentUserName: 'Love',
      },
    };
  }
}

/**
 * Water the garden: gently increments shared water counter and logs who watered
 */
export async function waterGarden(): Promise<GardenActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const row = await getOrCreateGardenRow();
    const currentName = user.displayName || user.username;

    if (row) {
      const updated = await (prisma as any).gardenState.update({
        where: { id: row.id },
        data: {
          waterCount: { increment: 1 },
          lastWateredAt: new Date(),
          lastWateredBy: currentName,
        },
      });

      revalidatePath('/garden');
      revalidatePath('/home');

      return {
        success: true,
        data: {
          waterCount: updated.waterCount,
          lastWateredAt: updated.lastWateredAt.toISOString(),
          lastWateredBy: updated.lastWateredBy,
          vanshMood: updated.vanshMood,
          pakhiMood: updated.pakhiMood,
          vanshMoodAt: updated.vanshMoodAt?.toISOString() ?? null,
          pakhiMoodAt: updated.pakhiMoodAt?.toISOString() ?? null,
          currentPromptId: updated.currentPromptId,
          vanshChoice: updated.vanshChoice,
          pakhiChoice: updated.pakhiChoice,
          currentUserName: currentName,
        },
      };
    }

    return {
      success: true,
      data: {
        ...DEFAULT_GARDEN_DATA,
        waterCount: 6,
        lastWateredBy: currentName,
        currentUserName: currentName,
      },
    };
  } catch (error) {
    return {
      success: true,
      data: {
        ...DEFAULT_GARDEN_DATA,
        waterCount: 6,
        currentUserName: 'Love',
      },
    };
  }
}

/**
 * Update daily Mood Flower for the current user
 */
export async function setGardenMood(mood: string): Promise<GardenActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const row = await getOrCreateGardenRow();
    const isPakhi = user.username.toLowerCase() === 'pakhi' || user.displayName.toLowerCase() === 'pakhi';
    const currentName = user.displayName || user.username;

    if (row) {
      const updateData = isPakhi
        ? { pakhiMood: mood, pakhiMoodAt: new Date() }
        : { vanshMood: mood, vanshMoodAt: new Date() };

      const updated = await (prisma as any).gardenState.update({
        where: { id: row.id },
        data: updateData,
      });

      revalidatePath('/garden');

      return {
        success: true,
        data: {
          waterCount: updated.waterCount,
          lastWateredAt: updated.lastWateredAt.toISOString(),
          lastWateredBy: updated.lastWateredBy,
          vanshMood: updated.vanshMood,
          pakhiMood: updated.pakhiMood,
          vanshMoodAt: updated.vanshMoodAt?.toISOString() ?? null,
          pakhiMoodAt: updated.pakhiMoodAt?.toISOString() ?? null,
          currentPromptId: updated.currentPromptId,
          vanshChoice: updated.vanshChoice,
          pakhiChoice: updated.pakhiChoice,
          currentUserName: currentName,
        },
      };
    }

    return {
      success: true,
      data: {
        ...DEFAULT_GARDEN_DATA,
        vanshMood: isPakhi ? DEFAULT_GARDEN_DATA.vanshMood : mood,
        pakhiMood: isPakhi ? mood : DEFAULT_GARDEN_DATA.pakhiMood,
        currentUserName: currentName,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Could not record mood. Please try again.',
    };
  }
}

/**
 * Record a choice for This or That prompt
 */
export async function setGardenChoice(promptId: number, choice: string): Promise<GardenActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const row = await getOrCreateGardenRow();
    const isPakhi = user.username.toLowerCase() === 'pakhi' || user.displayName.toLowerCase() === 'pakhi';
    const currentName = user.displayName || user.username;

    if (row) {
      const updateData = isPakhi
        ? { currentPromptId: promptId, pakhiChoice: choice }
        : { currentPromptId: promptId, vanshChoice: choice };

      const updated = await (prisma as any).gardenState.update({
        where: { id: row.id },
        data: updateData,
      });

      revalidatePath('/garden');

      return {
        success: true,
        data: {
          waterCount: updated.waterCount,
          lastWateredAt: updated.lastWateredAt.toISOString(),
          lastWateredBy: updated.lastWateredBy,
          vanshMood: updated.vanshMood,
          pakhiMood: updated.pakhiMood,
          vanshMoodAt: updated.vanshMoodAt?.toISOString() ?? null,
          pakhiMoodAt: updated.pakhiMoodAt?.toISOString() ?? null,
          currentPromptId: updated.currentPromptId,
          vanshChoice: updated.vanshChoice,
          pakhiChoice: updated.pakhiChoice,
          currentUserName: currentName,
        },
      };
    }

    return {
      success: true,
      data: {
        ...DEFAULT_GARDEN_DATA,
        currentPromptId: promptId,
        vanshChoice: isPakhi ? null : choice,
        pakhiChoice: isPakhi ? choice : null,
        currentUserName: currentName,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Could not record choice. Please try again.',
    };
  }
}

/**
 * Move to next This or That prompt
 */
export async function nextGardenPrompt(nextPromptId: number): Promise<GardenActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const row = await getOrCreateGardenRow();
    const currentName = user.displayName || user.username;

    if (row) {
      const updated = await (prisma as any).gardenState.update({
        where: { id: row.id },
        data: {
          currentPromptId: nextPromptId,
          vanshChoice: null,
          pakhiChoice: null,
        },
      });

      revalidatePath('/garden');

      return {
        success: true,
        data: {
          waterCount: updated.waterCount,
          lastWateredAt: updated.lastWateredAt.toISOString(),
          lastWateredBy: updated.lastWateredBy,
          vanshMood: updated.vanshMood,
          pakhiMood: updated.pakhiMood,
          vanshMoodAt: updated.vanshMoodAt?.toISOString() ?? null,
          pakhiMoodAt: updated.pakhiMoodAt?.toISOString() ?? null,
          currentPromptId: updated.currentPromptId,
          vanshChoice: null,
          pakhiChoice: null,
          currentUserName: currentName,
        },
      };
    }

    return {
      success: true,
      data: {
        ...DEFAULT_GARDEN_DATA,
        currentPromptId: nextPromptId,
        vanshChoice: null,
        pakhiChoice: null,
        currentUserName: currentName,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Could not change prompt.',
    };
  }
}

export interface DailyQuestionData {
  dateStr: string;
  intro: string;
  question: string;
  options: string[];
  vanshAnswer: string | null;
  pakhiAnswer: string | null;
  userAnswer: string | null;
  partnerAnswer: string | null;
  partnerName: string;
  bothAnswered: boolean;
  answersMatch: boolean;
  source: 'gemini' | 'grok' | 'curated';
}

export interface DailyQuestionResult {
  success: boolean;
  error?: string;
  data?: DailyQuestionData;
}

// In-memory fallback cache for current session if database table is not yet migrated
let memoryDailyQuestion: {
  dateStr: string;
  intro: string;
  question: string;
  options: string[];
  vanshAnswer: string | null;
  pakhiAnswer: string | null;
  source: 'gemini' | 'grok' | 'curated';
} | null = null;

/**
 * Fetch or generate today's shared Question of the Day
 */
export async function getTodayDailyQuestion(): Promise<DailyQuestionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const todayStr = getTodayDateIST();
    const isPakhi = user.username.toLowerCase() === 'pakhi' || user.displayName.toLowerCase() === 'pakhi';
    const partnerName = isPakhi ? 'Vansh' : 'Pakhi';

    // 1. Try fetching from database first
    let record: any = null;
    try {
      if ((prisma as any).gardenDailyQuestion) {
        record = await (prisma as any).gardenDailyQuestion.findUnique({
          where: { dateStr: todayStr },
        });
      }
    } catch {
      // Table might not exist yet
      record = null;
    }

    // 2. If not found in DB, check in-memory cache for today
    if (!record && memoryDailyQuestion && memoryDailyQuestion.dateStr === todayStr) {
      record = memoryDailyQuestion;
    }

    // 3. If still no question for today, generate one!
    if (!record) {
      const generated = await generateDailyQuestion();
      const optionsJson = JSON.stringify(generated.options);

      try {
        if ((prisma as any).gardenDailyQuestion) {
          record = await (prisma as any).gardenDailyQuestion.create({
            data: {
              dateStr: todayStr,
              intro: generated.intro || 'A tiny moment for us 💗',
              question: generated.question,
              options: optionsJson,
            },
          });
        }
      } catch {
        // Fallback to memory
        record = {
          dateStr: todayStr,
          intro: generated.intro || 'A tiny moment for us 💗',
          question: generated.question,
          options: optionsJson,
          vanshAnswer: null,
          pakhiAnswer: null,
          source: generated.source,
        };
        memoryDailyQuestion = record;
      }
    }

    // Parse options safely
    let parsedOptions: string[] = [];
    try {
      parsedOptions = typeof record.options === 'string' ? JSON.parse(record.options) : record.options;
    } catch {
      parsedOptions = ['Option 1 🌸', 'Option 2 🌿'];
    }

    const vanshAnswer = record.vanshAnswer || null;
    const pakhiAnswer = record.pakhiAnswer || null;
    const userAnswer = isPakhi ? pakhiAnswer : vanshAnswer;
    const partnerAnswer = isPakhi ? vanshAnswer : pakhiAnswer;
    const bothAnswered = Boolean(vanshAnswer && pakhiAnswer);
    const answersMatch = bothAnswered && vanshAnswer === pakhiAnswer;

    return {
      success: true,
      data: {
        dateStr: todayStr,
        intro: record.intro || 'A tiny moment for us 💗',
        question: record.question,
        options: parsedOptions,
        vanshAnswer,
        pakhiAnswer,
        userAnswer,
        partnerAnswer,
        partnerName,
        bothAnswered,
        answersMatch,
        source: record.source || 'gemini',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Could not load today’s question.',
    };
  }
}

/**
 * Record current partner's answer for today's Question of the Day
 */
export async function answerDailyQuestion(answer: string): Promise<DailyQuestionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const todayStr = getTodayDateIST();
    const isPakhi = user.username.toLowerCase() === 'pakhi' || user.displayName.toLowerCase() === 'pakhi';

    try {
      if ((prisma as any).gardenDailyQuestion) {
        const updateData = isPakhi
          ? { pakhiAnswer: answer, pakhiAt: new Date() }
          : { vanshAnswer: answer, vanshAt: new Date() };

        await (prisma as any).gardenDailyQuestion.update({
          where: { dateStr: todayStr },
          data: updateData,
        });
      }
    } catch {
      // Update memory cache fallback
      if (memoryDailyQuestion && memoryDailyQuestion.dateStr === todayStr) {
        if (isPakhi) {
          memoryDailyQuestion.pakhiAnswer = answer;
        } else {
          memoryDailyQuestion.vanshAnswer = answer;
        }
      }
    }

    revalidatePath('/garden');
    return await getTodayDailyQuestion();
  } catch (error) {
    return {
      success: false,
      error: 'Could not save your answer.',
    };
  }
}
