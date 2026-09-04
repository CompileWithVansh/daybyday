'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PinGate } from '@/components/PinGate';
import { PinkButton } from '@/components/PinkButton';
import { PinkCard } from '@/components/PinkCard';
import { PageTransition } from '@/components/PageTransition';
import { checkLockout } from '@/actions/pin.actions';
import { getEntries, getPartnerEntries, searchEntries, searchPartnerEntries } from '@/actions/diary.actions';
import {
  getCachedEntries,
  cacheServerEntries,
  getCachedPartnerEntries,
  cachePartnerEntries,
  getSyncQueue,
  syncPendingEntries,
  isPinVerifiedInSession,
  getCachedHasPin,
  OfflineDiaryEntry,
} from '@/lib/offlineStorage';
import { formatDate } from '@/lib/utils';

type DiaryTab = 'mine' | 'partner';

export default function DiaryPage() {
  const router = useRouter();
  const [pinVerified, setPinVerified] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<OfflineDiaryEntry[]>([]);
  const [partnerEntries, setPartnerEntries] = useState<OfflineDiaryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isPartnerSearching, setIsPartnerSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<DiaryTab>('mine');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check PIN state on mount
  useEffect(() => {
    // If already verified in this session, skip PinGate immediately
    if (isPinVerifiedInSession()) {
      setPinVerified(true);
      setLoading(false);
      return;
    }

    async function checkPin() {
      try {
        const result = await checkLockout();
        if (result.success && result.data) {
          setHasPin(result.data.hasPin);
        } else {
          setHasPin(getCachedHasPin() ?? true);
        }
      } catch {
        setHasPin(getCachedHasPin() ?? true);
      }
      setLoading(false);
    }
    checkPin();
  }, []);

  // Fetch entries after PIN is verified
  const fetchEntries = useCallback(async () => {
    // Load cached offline entries immediately
    const cached = getCachedEntries();
    setEntries(cached);
    const queue = getSyncQueue();
    setPendingSyncCount(queue.length);

    if (typeof window !== 'undefined' && !navigator.onLine) {
      setIsOfflineMode(true);
      return;
    }

    try {
      const result = await getEntries();
      if (result.success && result.data) {
        setIsOfflineMode(false);
        const serverEntries: OfflineDiaryEntry[] = result.data.map((e) => ({
          id: e.id,
          date: e.date,
          title: e.title,
          content: e.content,
          mood: e.mood,
          weather: e.weather,
          images: e.images,
          voiceNote: e.voiceNote,
          isOffline: false,
          syncStatus: 'synced',
        }));
        cacheServerEntries(serverEntries);
        setEntries(getCachedEntries());
      } else {
        setIsOfflineMode(true);
      }
    } catch {
      setIsOfflineMode(true);
    }
  }, []);

  const fetchPartnerEntries = useCallback(async () => {
    // Load cached partner entries immediately
    const cached = getCachedPartnerEntries();
    setPartnerEntries(cached);

    if (typeof window !== 'undefined' && !navigator.onLine) {
      return;
    }

    try {
      const result = await getPartnerEntries();
      if (result.success && result.data) {
        const partnerMapped: OfflineDiaryEntry[] = result.data.map((e) => ({
          id: e.id,
          date: e.date,
          title: e.title,
          content: e.content,
          mood: e.mood,
          weather: e.weather,
          images: e.images,
          voiceNote: e.voiceNote,
          isOffline: false,
          syncStatus: 'synced',
        }));
        cachePartnerEntries(partnerMapped);
        setPartnerEntries(partnerMapped);
      }
    } catch {
      // Keep cached partner entries
    }
  }, []);

  useEffect(() => {
    if (pinVerified) {
      fetchEntries();
      fetchPartnerEntries();
    }
  }, [pinVerified, fetchEntries, fetchPartnerEntries]);

  // Handle auto-sync on reconnect and sync-complete events
  useEffect(() => {
    const handleOnline = async () => {
      setIsOfflineMode(false);
      setIsSyncing(true);
      await syncPendingEntries();
      setIsSyncing(false);
      fetchEntries();
      fetchPartnerEntries();
    };

    const handleOffline = () => {
      setIsOfflineMode(true);
    };

    const handleSyncComplete = () => {
      fetchEntries();
      fetchPartnerEntries();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('daybyday-sync-complete', handleSyncComplete);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('daybyday-sync-complete', handleSyncComplete);
    };
  }, [fetchEntries, fetchPartnerEntries]);

  // Handle manual sync button
  const handleManualSync = async () => {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      alert('You are currently offline. Connect to Wi-Fi or mobile data to sync.');
      return;
    }
    setIsSyncing(true);
    await syncPendingEntries();
    setIsSyncing(false);
    fetchEntries();
    fetchPartnerEntries();
  };

  // Handle search for my diary
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      fetchEntries();
      return;
    }

    setIsSearching(true);
    if (typeof window !== 'undefined' && !navigator.onLine) {
      // Local offline search
      const q = query.toLowerCase();
      const allCached = getCachedEntries();
      setEntries(
        allCached.filter(
          (e) => e.title?.toLowerCase().includes(q) || e.content?.toLowerCase().includes(q)
        )
      );
      setIsSearching(false);
      return;
    }

    try {
      const result = await searchEntries(query.trim());
      if (result.success && result.data) {
        setEntries(
          result.data.map((e) => ({
            id: e.id,
            date: e.date,
            title: e.title,
            content: e.content,
            mood: e.mood,
            weather: e.weather,
          }))
        );
      } else {
        // Fallback to local filter
        const q = query.toLowerCase();
        setEntries(
          getCachedEntries().filter(
            (e) => e.title?.toLowerCase().includes(q) || e.content?.toLowerCase().includes(q)
          )
        );
      }
    } catch {
      const q = query.toLowerCase();
      setEntries(
        getCachedEntries().filter(
          (e) => e.title?.toLowerCase().includes(q) || e.content?.toLowerCase().includes(q)
        )
      );
    }
    setIsSearching(false);
  };

  // Handle search for partner's diary
  const handlePartnerSearch = async (query: string) => {
    setPartnerSearchQuery(query);
    if (!query.trim()) {
      fetchPartnerEntries();
      return;
    }

    setIsPartnerSearching(true);
    if (typeof window !== 'undefined' && !navigator.onLine) {
      const q = query.toLowerCase();
      const allPartner = getCachedPartnerEntries();
      setPartnerEntries(
        allPartner.filter(
          (e) => e.title?.toLowerCase().includes(q) || e.content?.toLowerCase().includes(q)
        )
      );
      setIsPartnerSearching(false);
      return;
    }

    try {
      const result = await searchPartnerEntries(query.trim());
      if (result.success && result.data) {
        setPartnerEntries(
          result.data.map((e) => ({
            id: e.id,
            date: e.date,
            title: e.title,
            content: e.content,
            mood: e.mood,
            weather: e.weather,
          }))
        );
      } else {
        const q = query.toLowerCase();
        setPartnerEntries(
          getCachedPartnerEntries().filter(
            (e) => e.title?.toLowerCase().includes(q) || e.content?.toLowerCase().includes(q)
          )
        );
      }
    } catch {
      const q = query.toLowerCase();
      setPartnerEntries(
        getCachedPartnerEntries().filter(
          (e) => e.title?.toLowerCase().includes(q) || e.content?.toLowerCase().includes(q)
        )
      );
    }
    setIsPartnerSearching(false);
  };

  // Handle new entry — navigate to /diary/new
  const handleNewEntry = () => {
    router.push('/diary/new');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-pink-400 font-cursive text-xl animate-pulse">Opening your diary... 💕</p>
      </div>
    );
  }

  // Show PIN gate if not verified
  if (!pinVerified) {
    return (
      <div className="p-4">
        <PinGate
          onSuccess={() => setPinVerified(true)}
          hasPin={hasPin ?? true}
        />
      </div>
    );
  }

  const displayEntries = activeTab === 'mine' ? entries : partnerEntries;
  const currentSearchQuery = activeTab === 'mine' ? searchQuery : partnerSearchQuery;

  return (
    <PageTransition>
      <div className="p-4 pb-24 space-y-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-pink-900 font-cursive">Love Diary 📖</h1>
          {pendingSyncCount > 0 && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-full font-medium transition-all flex items-center gap-1 shadow-sm active:scale-95"
            >
              <span>{isSyncing ? '🔄 Syncing...' : `⏳ ${pendingSyncCount} to sync`}</span>
              {!isSyncing && <span className="font-bold underline text-[10px]">Sync</span>}
            </button>
          )}
        </div>

        {/* Offline notice banner */}
        {isOfflineMode && (
          <div className="bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">📡</span>
              <div>
                <p className="font-bold text-amber-900">Working Offline</p>
                <p className="text-amber-700/80 text-[11px]">
                  Write anytime! Entries save locally & auto-sync when online.
                </p>
              </div>
            </div>
            {pendingSyncCount > 0 && (
              <span className="bg-amber-200/80 text-amber-900 font-bold px-2 py-1 rounded-lg text-[10px]">
                {pendingSyncCount} queued
              </span>
            )}
          </div>
        )}

        {/* Tab Toggle */}
        <div className="flex bg-pink-50 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('mine')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'mine'
                ? 'bg-white text-pink-700 shadow-sm'
                : 'text-pink-400 hover:text-pink-500'
            }`}
          >
            My Diary 📖
          </button>
          <button
            onClick={() => setActiveTab('partner')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'partner'
                ? 'bg-white text-pink-700 shadow-sm'
                : 'text-pink-400 hover:text-pink-500'
            }`}
          >
            Partner&apos;s Diary 💕
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder={activeTab === 'mine' ? 'Search entries...' : "Search partner's entries..."}
            value={activeTab === 'mine' ? searchQuery : partnerSearchQuery}
            onChange={(e) =>
              activeTab === 'mine'
                ? handleSearch(e.target.value)
                : handlePartnerSearch(e.target.value)
            }
            className="w-full px-4 py-3 pl-10 rounded-xl border border-pink-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all text-base bg-white"
            aria-label={activeTab === 'mine' ? 'Search diary entries' : "Search partner's diary entries"}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400">
            🔍
          </span>
          {(activeTab === 'mine' ? isSearching : isPartnerSearching) && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-400 text-sm">
              Searching...
            </span>
          )}
        </div>

        {/* Entry List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {displayEntries.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-pink-100 p-6">
                <p className="text-4xl mb-3">
                  {activeTab === 'mine' ? '📖' : '💌'}
                </p>
                <p className="text-pink-700 font-medium">
                  {activeTab === 'mine'
                    ? currentSearchQuery
                      ? 'No entries found.'
                      : 'No diary entries yet.'
                    : currentSearchQuery
                      ? 'No partner entries found.'
                      : 'No partner entries yet.'}
                </p>
                {activeTab === 'mine' && !currentSearchQuery && (
                  <p className="text-pink-400 text-sm mt-1">
                    Tap the + button below to write your first entry anytime, even offline!
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {displayEntries.map((entry) => (
                  <PinkCard
                    key={entry.id}
                    className={`cursor-pointer transition-all p-4 ${
                      activeTab === 'partner'
                        ? 'border-pink-200 bg-pink-50/50'
                        : 'hover:border-pink-300'
                    }`}
                  >
                    <button
                      onClick={() => {
                        if (activeTab === 'mine') {
                          router.push(`/diary/${entry.id}`);
                        } else {
                          router.push(`/diary/${entry.id}?readonly=true`);
                        }
                      }}
                      className="w-full text-left"
                      aria-label={`${activeTab === 'partner' ? "Partner's" : 'View'} diary entry for ${formatDate(entry.date)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-pink-700">
                            {formatDate(entry.date)}
                          </span>
                          {entry.syncStatus === 'pending' && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Offline ⏳
                            </span>
                          )}
                          {activeTab === 'partner' && (
                            <span className="text-[10px] bg-pink-200 text-pink-700 px-2 py-0.5 rounded-full font-medium">
                              Partner
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 text-lg">
                          {entry.mood && <span>{entry.mood}</span>}
                          {entry.weather && <span>{entry.weather}</span>}
                        </div>
                      </div>
                      {entry.title && (
                        <p className="text-pink-900 font-semibold text-sm mb-1 truncate">
                          {entry.title}
                        </p>
                      )}
                      <p className="text-pink-800 text-sm line-clamp-2">
                        {entry.content || 'No content'}
                      </p>
                    </button>
                  </PinkCard>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* FAB - New Entry Button (only on My Diary tab) */}
        {activeTab === 'mine' && (
          <div className="fixed bottom-24 right-4 z-40">
            <PinkButton
              onClick={handleNewEntry}
              className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-2xl p-0 active:scale-95"
              aria-label="Create new diary entry"
            >
              +
            </PinkButton>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
