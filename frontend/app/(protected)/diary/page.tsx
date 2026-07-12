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
import { formatDate } from '@/lib/utils';

interface DiaryEntryItem {
  id: number;
  date: string;
  title: string;
  content: string;
  mood: string;
  weather: string;
}

type DiaryTab = 'mine' | 'partner';

export default function DiaryPage() {
  const router = useRouter();
  const [pinVerified, setPinVerified] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<DiaryEntryItem[]>([]);
  const [partnerEntries, setPartnerEntries] = useState<DiaryEntryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isPartnerSearching, setIsPartnerSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<DiaryTab>('mine');

  // Check PIN state on mount
  useEffect(() => {
    async function checkPin() {
      const result = await checkLockout();
      if (result.success && result.data) {
        setHasPin(result.data.hasPin);
      } else {
        setHasPin(true);
      }
      setLoading(false);
    }
    checkPin();
  }, []);

  // Fetch entries after PIN is verified
  const fetchEntries = useCallback(async () => {
    const result = await getEntries();
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
    }
  }, []);

  const fetchPartnerEntries = useCallback(async () => {
    const result = await getPartnerEntries();
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
    }
  }, []);

  useEffect(() => {
    if (pinVerified) {
      fetchEntries();
      fetchPartnerEntries();
    }
  }, [pinVerified, fetchEntries, fetchPartnerEntries]);

  // Handle search for my diary
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      fetchEntries();
      return;
    }

    setIsSearching(true);
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
        <p className="text-pink-400">Loading...</p>
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
      <div className="p-4 pb-24 space-y-4">
        {/* Header */}
        <h1 className="text-2xl font-bold text-pink-900">Diary</h1>

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

        {/* Search Bar — shown for both tabs */}
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
            className="w-full px-4 py-3 pl-10 rounded-xl border border-pink-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all text-base"
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
              <div className="text-center py-12">
                <p className="text-4xl mb-3">
                  {activeTab === 'mine' ? '📖' : '💌'}
                </p>
                <p className="text-pink-600">
                  {activeTab === 'mine'
                    ? currentSearchQuery
                      ? 'No entries found.'
                      : 'No diary entries yet.'
                    : currentSearchQuery
                      ? 'No partner entries found.'
                      : "No partner entries yet."}
                </p>
                {activeTab === 'mine' && !currentSearchQuery && (
                  <p className="text-pink-400 text-sm mt-1">
                    Tap the + button to create your first entry
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
                          <span className="text-sm font-medium text-pink-700">
                            {formatDate(entry.date)}
                          </span>
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
          <div className="fixed bottom-24 right-4">
            <PinkButton
              onClick={handleNewEntry}
              className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl p-0"
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
