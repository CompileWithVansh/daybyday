'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface AnnotationData {
  id: number;
  date: string;
  completed: boolean;
  emojis: string;
  note: string;
  user: { id: number; displayName: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Get the last day of a given month/year.
 */
function getLastDayOfMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Fetches all calendar annotations for a given month and year (from both users).
 */
export async function getAnnotations(
  month: number,
  year: number
): Promise<ActionResult<AnnotationData[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const lastDay = getLastDayOfMonth(month, year);
    const startDate = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`);

    const annotations = await prisma.calendarAnnotation.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: { select: { id: true, displayName: true } },
      },
      orderBy: { date: 'asc' },
    });

    const mapped: AnnotationData[] = annotations.map((a) => ({
      id: a.id,
      date: a.date.toISOString().split('T')[0],
      completed: a.completed,
      emojis: a.emojis,
      note: a.note,
      user: a.user ? { id: a.user.id, displayName: a.user.displayName } : null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));

    return { success: true, data: mapped };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to fetch annotations. Please try again.',
    };
  }
}

/**
 * Marks a date as completed or uncompleted for the current user.
 * Finds existing annotation for the user+date, updates if exists, creates if not.
 */
export async function markDate(
  date: string,
  completed: boolean,
  note?: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const dateObj = new Date(date + 'T12:00:00.000Z');
    const dayStart = new Date(date + 'T00:00:00.000Z');
    const dayEnd = new Date(date + 'T23:59:59.999Z');

    // Find existing annotation for this user + date
    const existing = await prisma.calendarAnnotation.findFirst({
      where: {
        userId: user.id,
        date: { gte: dayStart, lte: dayEnd },
      },
    });

    if (existing) {
      const updateData: { completed: boolean; note?: string } = { completed };
      if (note !== undefined) {
        updateData.note = note;
      }
      await prisma.calendarAnnotation.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      await prisma.calendarAnnotation.create({
        data: {
          date: dateObj,
          completed,
          emojis: '[]',
          note: note || '',
          userId: user.id,
        },
      });
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to update annotation. Please try again.',
    };
  }
}

/**
 * Adds emojis to a date annotation for the current user.
 * Finds existing annotation for user+date, updates if exists, creates if not.
 * Preserves the existing note when updating.
 */
export async function addEmoji(
  date: string,
  emojis: string[]
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const dateObj = new Date(date + 'T12:00:00.000Z');
    const dayStart = new Date(date + 'T00:00:00.000Z');
    const dayEnd = new Date(date + 'T23:59:59.999Z');
    const emojisJson = JSON.stringify(emojis);

    // Find existing annotation for this user + date
    const existing = await prisma.calendarAnnotation.findFirst({
      where: {
        userId: user.id,
        date: { gte: dayStart, lte: dayEnd },
      },
    });

    if (existing) {
      await prisma.calendarAnnotation.update({
        where: { id: existing.id },
        data: { emojis: emojisJson },
      });
    } else {
      await prisma.calendarAnnotation.create({
        data: {
          date: dateObj,
          completed: false,
          emojis: emojisJson,
          note: '',
          userId: user.id,
        },
      });
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to update emoji annotation. Please try again.',
    };
  }
}

/**
 * Updates an existing annotation for the current user on a given date.
 * Allows updating completed, emojis, and note fields.
 */
export async function updateAnnotation(
  date: string,
  data: { completed?: boolean; emojis?: string[]; note?: string }
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const dateObj = new Date(date + 'T12:00:00.000Z');
    const dayStart = new Date(date + 'T00:00:00.000Z');
    const dayEnd = new Date(date + 'T23:59:59.999Z');

    // Find existing annotation for this user + date
    const existing = await prisma.calendarAnnotation.findFirst({
      where: {
        userId: user.id,
        date: { gte: dayStart, lte: dayEnd },
      },
    });

    if (existing) {
      const updateData: { completed?: boolean; emojis?: string; note?: string } = {};
      if (data.completed !== undefined) updateData.completed = data.completed;
      if (data.emojis !== undefined) updateData.emojis = JSON.stringify(data.emojis);
      if (data.note !== undefined) updateData.note = data.note;

      await prisma.calendarAnnotation.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      // Create new annotation with provided data
      await prisma.calendarAnnotation.create({
        data: {
          date: dateObj,
          completed: data.completed ?? false,
          emojis: data.emojis ? JSON.stringify(data.emojis) : '[]',
          note: data.note ?? '',
          userId: user.id,
        },
      });
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to update annotation. Please try again.',
    };
  }
}

/**
 * Gets a formatted monthly summary for a given month/year.
 * Returns annotations grouped with counts and emoji highlights.
 */
export async function getMonthSummary(
  month: number,
  year: number
): Promise<ActionResult<{ completedDays: number; emojiDays: number; noteDays: number; annotations: AnnotationData[] }>> {
  try {
    const result = await getAnnotations(month, year);
    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to get annotations' };
    }

    const annotations = result.data;
    const completedDays = annotations.filter((a) => a.completed).length;
    const emojiDays = annotations.filter((a) => {
      try {
        const parsed = JSON.parse(a.emojis);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch {
        return false;
      }
    }).length;
    const noteDays = annotations.filter((a) => a.note && a.note.trim().length > 0).length;

    return {
      success: true,
      data: {
        completedDays,
        emojiDays,
        noteDays,
        annotations,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to get month summary. Please try again.',
    };
  }
}
