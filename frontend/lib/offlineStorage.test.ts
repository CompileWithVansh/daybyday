import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCachedEntries,
  cacheServerEntries,
  saveOfflineEntry,
  getSyncQueue,
  cachePinHash,
  verifyOfflinePin,
  isPinVerifiedInSession,
  setPinVerifiedInSession,
  getCachedHasPin,
} from './offlineStorage';

// Mock localStorage and sessionStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'window', { value: global, writable: true });
Object.defineProperty(global, 'navigator', { value: { onLine: true }, writable: true });
Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock });

// Crypto subtle mock for vitest node environment if needed
if (!global.crypto || !global.crypto.subtle) {
  const nodeCrypto = require('crypto');
  Object.defineProperty(global, 'crypto', {
    value: {
      subtle: {
        digest: async (algorithm: string, data: Uint8Array) => {
          const hash = nodeCrypto.createHash('sha256').update(Buffer.from(data)).digest();
          return hash.buffer;
        },
      },
    },
  });
}

describe('offlineStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
  });

  describe('Diary Entry Caching', () => {
    it('returns empty array when cache is empty', () => {
      expect(getCachedEntries()).toEqual([]);
    });

    it('caches server entries correctly', () => {
      const serverEntries = [
        {
          id: 1,
          date: '2026-09-04',
          title: 'A lovely day',
          content: 'We met at the cafe',
          mood: '🥰',
          weather: '☀️',
        },
      ];
      cacheServerEntries(serverEntries);
      const cached = getCachedEntries();
      expect(cached.length).toBe(1);
      expect(cached[0].id).toBe(1);
      expect(cached[0].title).toBe('A lovely day');
    });

    it('preserves pending offline entries when refreshing server entries', () => {
      // 1. Create offline entry
      saveOfflineEntry({
        date: '2026-09-04',
        title: 'Offline entry',
        content: 'Written on airplane',
        mood: '😊',
        weather: '☁️',
      });

      // 2. Refresh server entries
      const serverEntries = [
        {
          id: 10,
          date: '2026-09-01',
          title: 'Older server entry',
          content: 'Old note',
          mood: '🥰',
          weather: '☀️',
        },
      ];
      cacheServerEntries(serverEntries);

      const cached = getCachedEntries();
      expect(cached.length).toBe(2);
      expect(cached[0].syncStatus).toBe('pending');
      expect(String(cached[0].id)).toMatch(/^offline_/);
      expect(cached[1].id).toBe(10);
    });
  });

  describe('Offline Entry Creation & Editing', () => {
    it('creates a new offline entry with temp id and queues for sync', () => {
      const entry = saveOfflineEntry({
        date: '2026-09-04',
        title: 'My Secret Thoughts',
        content: 'Thinking about you...',
        mood: '🥰',
        weather: '🌧️',
      });

      expect(entry.isOffline).toBe(true);
      expect(entry.syncStatus).toBe('pending');
      expect(String(entry.id)).toMatch(/^offline_/);

      const queue = getSyncQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].action).toBe('create');
      expect(queue[0].data.title).toBe('My Secret Thoughts');
    });

    it('updates an existing offline entry in cache and queue', () => {
      const created = saveOfflineEntry({
        date: '2026-09-04',
        title: 'Initial Title',
        content: 'Draft content',
        mood: '😊',
        weather: '☀️',
      });

      const updated = saveOfflineEntry(
        {
          date: '2026-09-04',
          title: 'Edited Title',
          content: 'Updated content',
          mood: '🥰',
          weather: '☀️',
        },
        created.id
      );

      expect(updated.title).toBe('Edited Title');
      const cached = getCachedEntries();
      expect(cached.length).toBe(1);
      expect(cached[0].title).toBe('Edited Title');

      const queue = getSyncQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].data.title).toBe('Edited Title');
    });

    it('queues an update action when editing a server entry offline', () => {
      // Seed server entry in cache
      cacheServerEntries([
        {
          id: 42,
          date: '2026-09-01',
          title: 'Server Note',
          content: 'Original text',
          mood: '😌',
          weather: '☀️',
        },
      ]);

      saveOfflineEntry(
        {
          date: '2026-09-01',
          title: 'Server Note (Updated Offline)',
          content: 'Modified text while offline',
          mood: '🥰',
          weather: '☀️',
        },
        42
      );

      const queue = getSyncQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].action).toBe('update');
      expect(queue[0].realId).toBe(42);
      expect(queue[0].data.title).toBe('Server Note (Updated Offline)');
    });
  });

  describe('Offline PIN Verification & Session', () => {
    it('hashes and validates PIN correctly offline', async () => {
      await cachePinHash('1234');
      expect(getCachedHasPin()).toBe(true);

      const isCorrect = await verifyOfflinePin('1234');
      expect(isCorrect).toBe(true);

      const isWrong = await verifyOfflinePin('9999');
      expect(isWrong).toBe(false);
    });

    it('tracks session PIN verification state', () => {
      expect(isPinVerifiedInSession()).toBe(false);
      setPinVerifiedInSession(true);
      expect(isPinVerifiedInSession()).toBe(true);
      setPinVerifiedInSession(false);
      expect(isPinVerifiedInSession()).toBe(false);
    });
  });
});
