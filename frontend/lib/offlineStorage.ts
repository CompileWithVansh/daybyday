'use client';

import { createEntry, updateEntry } from '@/actions/diary.actions';

export interface OfflineDiaryEntry {
  id: number | string;
  date: string;
  title: string;
  content: string;
  mood: string;
  weather: string;
  images?: Array<{ id: number; url: string; name: string }>;
  voiceNote?: { id: number; url: string; name: string } | null;
  isOffline?: boolean;
  syncStatus?: 'synced' | 'pending';
  updatedAt?: string;
}

export interface SyncQueueItem {
  tempId: string;
  realId?: number;
  action: 'create' | 'update';
  data: {
    date: string;
    title: string;
    content: string;
    mood: string;
    weather: string;
    images?: Array<{ id: number; url: string; name: string }>;
    voiceNote?: { id: number; url: string; name: string } | null;
  };
  timestamp: number;
}

const STORAGE_KEYS = {
  CACHED_ENTRIES: 'daybyday_cached_diary_entries',
  CACHED_PARTNER: 'daybyday_cached_partner_entries',
  SYNC_QUEUE: 'daybyday_diary_sync_queue',
  PIN_HASH: 'daybyday_pin_hash',
  HAS_PIN: 'daybyday_has_pin',
  SESSION_PIN_VERIFIED: 'daybyday_pin_verified_session',
};

// --- Entry Caching ---

export function getCachedEntries(): OfflineDiaryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CACHED_ENTRIES);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading cached entries:', err);
    return [];
  }
}

export function cacheServerEntries(entries: OfflineDiaryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    const queue = getSyncQueue();
    // Keep pending offline entries at the top
    const pendingEntries = getCachedEntries().filter((e) => e.syncStatus === 'pending');

    // Filter out server entries that have the same ID as pending updates
    const pendingUpdateIds = new Set(
      queue.filter((q) => q.action === 'update' && q.realId).map((q) => q.realId)
    );

    const merged = [
      ...pendingEntries,
      ...entries.filter((e) => !pendingUpdateIds.has(Number(e.id))),
    ];

    localStorage.setItem(STORAGE_KEYS.CACHED_ENTRIES, JSON.stringify(merged));
  } catch (err) {
    console.error('Error caching server entries:', err);
  }
}

export function getCachedPartnerEntries(): OfflineDiaryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CACHED_PARTNER);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function cachePartnerEntries(entries: OfflineDiaryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CACHED_PARTNER, JSON.stringify(entries));
  } catch (err) {
    console.error('Error caching partner entries:', err);
  }
}

// --- Sync Queue Operations ---

export function getSyncQueue(): SyncQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSyncQueue(queue: SyncQueueItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  } catch (err) {
    console.error('Error saving sync queue:', err);
  }
}

// --- Offline Entry Creation & Editing ---

export function saveOfflineEntry(
  data: SyncQueueItem['data'],
  existingId?: number | string
): OfflineDiaryEntry {
  const currentEntries = getCachedEntries();
  const currentQueue = getSyncQueue();

  if (existingId !== undefined) {
    // Updating an existing entry
    const isExistingTemp = typeof existingId === 'string' && existingId.startsWith('offline_');
    const entryId = isExistingTemp ? existingId : Number(existingId);

    const updatedEntry: OfflineDiaryEntry = {
      id: entryId,
      date: data.date,
      title: data.title || '',
      content: data.content,
      mood: data.mood,
      weather: data.weather,
      images: data.images || [],
      voiceNote: data.voiceNote || null,
      isOffline: true,
      syncStatus: 'pending',
      updatedAt: new Date().toISOString(),
    };

    const newEntries = currentEntries.map((e) => (String(e.id) === String(entryId) ? updatedEntry : e));
    if (!newEntries.some((e) => String(e.id) === String(entryId))) {
      newEntries.unshift(updatedEntry);
    }
    localStorage.setItem(STORAGE_KEYS.CACHED_ENTRIES, JSON.stringify(newEntries));

    // Update sync queue
    if (isExistingTemp) {
      // Find existing queue item and update its data
      const queueIndex = currentQueue.findIndex((q) => q.tempId === existingId);
      if (queueIndex >= 0) {
        currentQueue[queueIndex].data = data;
        currentQueue[queueIndex].timestamp = Date.now();
      } else {
        currentQueue.push({
          tempId: existingId as string,
          action: 'create',
          data,
          timestamp: Date.now(),
        });
      }
    } else {
      // It's a real server entry updated offline
      const numId = Number(existingId);
      const queueIndex = currentQueue.findIndex((q) => q.action === 'update' && q.realId === numId);
      if (queueIndex >= 0) {
        currentQueue[queueIndex].data = data;
        currentQueue[queueIndex].timestamp = Date.now();
      } else {
        currentQueue.push({
          tempId: `update_${numId}_${Date.now()}`,
          realId: numId,
          action: 'update',
          data,
          timestamp: Date.now(),
        });
      }
    }

    saveSyncQueue(currentQueue);
    return updatedEntry;
  }

  // Creating a new offline entry
  const tempId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newEntry: OfflineDiaryEntry = {
    id: tempId,
    date: data.date,
    title: data.title || '',
    content: data.content,
    mood: data.mood,
    weather: data.weather,
    images: data.images || [],
    voiceNote: data.voiceNote || null,
    isOffline: true,
    syncStatus: 'pending',
    updatedAt: new Date().toISOString(),
  };

  const newEntries = [newEntry, ...currentEntries];
  localStorage.setItem(STORAGE_KEYS.CACHED_ENTRIES, JSON.stringify(newEntries));

  currentQueue.push({
    tempId,
    action: 'create',
    data,
    timestamp: Date.now(),
  });
  saveSyncQueue(currentQueue);

  return newEntry;
}

// --- Syncing Engine ---

let isSyncing = false;

export async function syncPendingEntries(): Promise<{
  success: boolean;
  syncedCount: number;
  errors: string[];
}> {
  if (typeof window === 'undefined') return { success: true, syncedCount: 0, errors: [] };
  if (!navigator.onLine) {
    return { success: false, syncedCount: 0, errors: ['Device is offline'] };
  }
  if (isSyncing) {
    return { success: true, syncedCount: 0, errors: ['Sync already in progress'] };
  }

  const queue = getSyncQueue();
  if (queue.length === 0) {
    return { success: true, syncedCount: 0, errors: [] };
  }

  isSyncing = true;
  let syncedCount = 0;
  const errors: string[] = [];
  const remainingQueue: SyncQueueItem[] = [];
  let entries = getCachedEntries();

  for (const item of queue) {
    try {
      if (item.action === 'create') {
        const res = await createEntry({
          date: item.data.date,
          title: item.data.title,
          content: item.data.content,
          mood: item.data.mood,
          weather: item.data.weather,
        });

        if (res.success && res.data) {
          syncedCount++;
          // Replace temporary entry with server entry in local cache
          const realEntry = res.data;
          entries = entries.map((e) =>
            e.id === item.tempId
              ? {
                  ...realEntry,
                  isOffline: false,
                  syncStatus: 'synced',
                }
              : e
          );
        } else {
          errors.push(res.error || 'Failed to sync created entry');
          remainingQueue.push(item);
        }
      } else if (item.action === 'update' && item.realId) {
        const res = await updateEntry(item.realId, {
          title: item.data.title,
          content: item.data.content,
          mood: item.data.mood,
          weather: item.data.weather,
        });

        if (res.success && res.data) {
          syncedCount++;
          const realEntry = res.data;
          entries = entries.map((e) =>
            Number(e.id) === item.realId
              ? {
                  ...realEntry,
                  isOffline: false,
                  syncStatus: 'synced',
                }
              : e
          );
        } else {
          errors.push(res.error || 'Failed to sync updated entry');
          remainingQueue.push(item);
        }
      }
    } catch (err: any) {
      errors.push(err.message || 'Network exception during sync');
      remainingQueue.push(item);
    }
  }

  saveSyncQueue(remainingQueue);
  localStorage.setItem(STORAGE_KEYS.CACHED_ENTRIES, JSON.stringify(entries));
  isSyncing = false;

  if (syncedCount > 0) {
    window.dispatchEvent(
      new CustomEvent('daybyday-sync-complete', {
        detail: { syncedCount },
      })
    );
  }

  return {
    success: errors.length === 0,
    syncedCount,
    errors,
  };
}

// --- Offline PIN Security ---

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function cachePinHash(pin: string): Promise<void> {
  if (typeof window === 'undefined' || !pin) return;
  try {
    const hash = await sha256(pin);
    localStorage.setItem(STORAGE_KEYS.PIN_HASH, hash);
    localStorage.setItem(STORAGE_KEYS.HAS_PIN, 'true');
  } catch (err) {
    console.error('Error caching PIN hash:', err);
  }
}

export async function verifyOfflinePin(pin: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const storedHash = localStorage.getItem(STORAGE_KEYS.PIN_HASH);
    if (!storedHash) {
      // No cached PIN hash yet: if offline, allow bypass if pin length is 4 or previously had pin
      return pin.length === 4;
    }
    const hash = await sha256(pin);
    return hash === storedHash;
  } catch {
    return pin.length === 4;
  }
}

export function isPinVerifiedInSession(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(STORAGE_KEYS.SESSION_PIN_VERIFIED) === 'true';
}

export function setPinVerifiedInSession(verified: boolean): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEYS.SESSION_PIN_VERIFIED, verified ? 'true' : 'false');
}

export function getCachedHasPin(): boolean | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEYS.HAS_PIN);
  return raw !== null ? raw === 'true' : null;
}
