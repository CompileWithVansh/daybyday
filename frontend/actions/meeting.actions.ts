'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface MeetingDateResponse {
  id: number;
  date: string;
  startDate: string;
  setBy: { id: number; displayName: string } | null;
}

interface GetMeetingDateResult {
  success: boolean;
  error?: string;
  data?: MeetingDateResponse | null;
}

interface SetMeetingDateResult {
  success: boolean;
  error?: string;
}

/**
 * Fetches the most recently set meeting date (shared between both users).
 * Orders by createdAt desc to get the latest one that was SET.
 */
export async function getMeetingDate(): Promise<GetMeetingDateResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const meetingDate = await prisma.meetingDate.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { setBy: { select: { displayName: true, id: true } } },
    });

    if (!meetingDate) return { success: true, data: null };

    return {
      success: true,
      data: {
        id: meetingDate.id,
        date: meetingDate.date.toISOString().split('T')[0],
        startDate: meetingDate.startDate.toISOString().split('T')[0],
        setBy: meetingDate.setBy
          ? { id: meetingDate.setBy.id, displayName: meetingDate.setBy.displayName }
          : null,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to fetch meeting date. Please try again.',
    };
  }
}

/**
 * Sets a new meeting date. Both users can update; the latest set date is active.
 * @param date - ISO date string for the meeting date
 */
export async function setMeetingDate(date: string): Promise<SetMeetingDateResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    await prisma.meetingDate.create({
      data: {
        date: new Date(date),
        startDate: new Date(),
        setById: user.id,
      },
    });

    revalidatePath('/home');
    revalidatePath('/settings');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to set meeting date. Please try again.',
    };
  }
}
