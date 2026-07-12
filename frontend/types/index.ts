// Shared TypeScript types for the DayByDay couple app

export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatar: string | null;
  diaryPin: string | null;
  pinFailedAttempts: number;
  pinLockedUntil: string | null;
}

export interface MeetingDate {
  id: number;
  date: string;
  startDate: string;
  setBy: { id: number; displayName: string } | null;
}

export interface CalendarAnnotation {
  id: number;
  date: string;
  completed: boolean;
  emojis: string; // JSON array of emoji strings e.g. '["❤️","🎂"]'
  user: { id: number; displayName: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryEntry {
  id: number;
  date: string;
  title: string;
  content: string;
  mood: string;
  weather: string;
  images: Array<{ url: string; name: string }>;
  voiceNote: string | null;
  user: { id: number };
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: number;
  imageUrl: string;
  image?: { url: string }; // Compatibility layer for gallery page
  uploadDate: string;
  eventTag: string | null;
  user: { id: number; displayName: string };
  albumId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Album {
  id: number;
  name: string;
  photos: Photo[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

/** @deprecated - Legacy Strapi API response wrapper. No longer used with Prisma backend. */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}
