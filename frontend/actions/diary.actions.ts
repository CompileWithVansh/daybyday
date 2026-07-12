'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

interface DiaryEntryResponse {
  id: number;
  date: string;
  title: string;
  content: string;
  mood: string;
  weather: string;
  images: Array<{ id: number; url: string; name: string }>;
  voiceNote: { id: number; url: string; name: string } | null;
  user: { id: number };
  createdAt: string;
  updatedAt: string;
}

interface GetEntriesResult {
  success: boolean;
  error?: string;
  data?: DiaryEntryResponse[];
}

interface GetEntryResult {
  success: boolean;
  error?: string;
  data?: DiaryEntryResponse;
}

interface CreateEntryResult {
  success: boolean;
  error?: string;
  data?: DiaryEntryResponse;
}

interface UpdateEntryResult {
  success: boolean;
  error?: string;
  data?: DiaryEntryResponse;
}

interface SearchEntriesResult {
  success: boolean;
  error?: string;
  data?: DiaryEntryResponse[];
}

/**
 * Converts a Prisma diary entry to the response format.
 */
function formatEntry(entry: {
  id: number;
  date: Date;
  title: string;
  content: string;
  mood: string;
  weather: string;
  images: string;
  voiceNote: string | null;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}): DiaryEntryResponse {
  let parsedImages: Array<{ id: number; url: string; name: string }> = [];
  try {
    parsedImages = JSON.parse(entry.images);
  } catch {
    parsedImages = [];
  }

  let parsedVoiceNote: { id: number; url: string; name: string } | null = null;
  if (entry.voiceNote) {
    try {
      parsedVoiceNote = JSON.parse(entry.voiceNote);
    } catch {
      parsedVoiceNote = null;
    }
  }

  return {
    id: entry.id,
    date: entry.date.toISOString().split('T')[0],
    title: entry.title,
    content: entry.content,
    mood: entry.mood,
    weather: entry.weather,
    images: parsedImages,
    voiceNote: parsedVoiceNote,
    user: { id: entry.userId },
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

/**
 * Fetches all diary entries for the current user in reverse chronological order.
 */
export async function getEntries(): Promise<GetEntriesResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const entries = await prisma.diaryEntry.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
    });

    return { success: true, data: entries.map(formatEntry) };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to fetch diary entries. Please try again.',
    };
  }
}

/**
 * Fetches a single diary entry by ID.
 * Returns the entry only if it belongs to the current user OR their partner.
 */
export async function getEntryById(id: number): Promise<GetEntryResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const entry = await prisma.diaryEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return { success: false, error: 'Entry not found' };
    }

    return { success: true, data: formatEntry(entry) };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to fetch diary entry. Please try again.',
    };
  }
}

/**
 * Creates a new diary entry.
 * @param data - Entry data including date, title, content, mood, weather
 */
export async function createEntry(data: {
  date: string;
  title?: string;
  content: string;
  mood: string;
  weather: string;
  user?: number; // Ignored — user is determined from auth
}): Promise<CreateEntryResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const entry = await prisma.diaryEntry.create({
      data: {
        date: new Date(data.date),
        title: data.title || '',
        content: data.content,
        mood: data.mood,
        weather: data.weather,
        userId: user.id,
      },
    });

    return { success: true, data: formatEntry(entry) };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to create diary entry. Please try again.',
    };
  }
}

/**
 * Updates an existing diary entry.
 * @param id - Entry ID to update
 * @param data - Partial entry data to update. Images is an array of image IDs to keep.
 */
export async function updateEntry(
  id: number,
  data: Partial<{
    title: string;
    content: string;
    mood: string;
    weather: string;
    images: number[];
    voiceNote: number | null;
  }>
): Promise<UpdateEntryResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Verify ownership
    const existing = await prisma.diaryEntry.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return { success: false, error: 'Entry not found or access denied' };
    }

    // Build the update payload
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.mood !== undefined) updateData.mood = data.mood;
    if (data.weather !== undefined) updateData.weather = data.weather;

    // Handle images: filter existing images to only keep those whose IDs are in the array
    if (data.images !== undefined) {
      let existingImages: Array<{ id: number; url: string; name: string }> = [];
      try {
        existingImages = JSON.parse(existing.images);
      } catch {
        existingImages = [];
      }
      const keptImages = existingImages.filter((img) => data.images!.includes(img.id));
      updateData.images = JSON.stringify(keptImages);
    }

    // Handle voiceNote: if null, clear it; if a number, keep existing voiceNote
    if (data.voiceNote === null) {
      updateData.voiceNote = null;
    }

    const entry = await prisma.diaryEntry.update({
      where: { id },
      data: updateData,
    });

    return { success: true, data: formatEntry(entry) };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to update diary entry. Please try again.',
    };
  }
}

/**
 * Searches diary entries by keyword (case-insensitive content and title match).
 * @param keyword - Search term to match against entry content or title
 */
export async function searchEntries(keyword: string): Promise<SearchEntriesResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const entries = await prisma.diaryEntry.findMany({
      where: {
        userId: user.id,
        OR: [
          { content: { contains: keyword, mode: 'insensitive' } },
          { title: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      orderBy: { date: 'desc' },
    });

    return { success: true, data: entries.map(formatEntry) };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to search diary entries. Please try again.',
    };
  }
}

/**
 * Searches partner's diary entries by keyword (case-insensitive content and title match).
 * @param keyword - Search term to match against partner entry content or title
 */
export async function searchPartnerEntries(keyword: string): Promise<SearchEntriesResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const entries = await prisma.diaryEntry.findMany({
      where: {
        userId: { not: user.id },
        OR: [
          { content: { contains: keyword, mode: 'insensitive' } },
          { title: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      orderBy: { date: 'desc' },
    });

    return { success: true, data: entries.map(formatEntry) };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to search partner entries. Please try again.',
    };
  }
}

/**
 * Fetches the partner's diary entries (the OTHER user's entries).
 * This allows one user to read their partner's diary.
 */
export async function getPartnerEntries(): Promise<GetEntriesResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Get the OTHER user's entries (not the current user)
    const partnerEntries = await prisma.diaryEntry.findMany({
      where: { userId: { not: user.id } },
      orderBy: { date: 'desc' },
    });

    return { success: true, data: partnerEntries.map(formatEntry) };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to fetch partner entries. Please try again.',
    };
  }
}

/**
 * Uploads a file (image or audio) to Cloudinary.
 * @param formData - FormData containing the file to upload under 'files' key
 * @returns The uploaded media object with id, URL, and name
 */
export async function uploadMedia(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  data?: { id: number; url: string; name: string };
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const file = formData.get('files') as File | null;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadToCloudinary(buffer, 'daybyday/diary');

    return {
      success: true,
      data: {
        id: Date.now(), // Use timestamp as a unique identifier
        url: result.url,
        name: file.name,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Unable to upload file. Please try again.',
    };
  }
}
