'use client';

import { useEffect, useState } from 'react';
import { PinkButton } from '@/components/PinkButton';
import { PinkCard } from '@/components/PinkCard';
import { PageTransition } from '@/components/PageTransition';
import { getMeetingDate, setMeetingDate } from '@/actions/meeting.actions';
import { logout } from '@/actions/auth.actions';
import { usePwaInstall } from '@/lib/usePwaInstall';
import { getCachedEntries, getSyncQueue, syncPendingEntries } from '@/lib/offlineStorage';

export default function SettingsPage() {
  const [date, setDate] = useState('');
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [setByName, setSetByName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function fetchMeetingDate() {
      const result = await getMeetingDate();
      if (result.success && result.data) {
        setCurrentDate(result.data.date);
        setSetByName(result.data.setBy?.displayName ?? null);
        setDate(result.data.date);
      }
      setFetching(false);
    }
    fetchMeetingDate();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!date) {
      setMessage({ type: 'error', text: 'Please select a date.' });
      return;
    }

    setLoading(true);
    const result = await setMeetingDate(date);
    setLoading(false);

    if (result.success) {
      setCurrentDate(date);
      setSetByName(null); // Will refresh on next load
      setMessage({ type: 'success', text: 'Meeting date updated successfully!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to set meeting date.' });
    }
  }

  return (
    <PageTransition>
    <div className="p-4 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-pink-900">Settings</h1>

      <PinkCard>
        <h2 className="text-lg font-semibold text-pink-800 mb-4">Meeting Date</h2>

        {fetching ? (
          <p className="text-pink-400 text-sm">Loading...</p>
        ) : (
          <>
            {currentDate && (
              <div className="mb-4 p-3 bg-pink-50 rounded-lg">
                <p className="text-sm text-pink-700">
                  Current meeting date:{' '}
                  <span className="font-medium">
                    {new Date(currentDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </p>
                {setByName && (
                  <p className="text-xs text-pink-500 mt-1">
                    Set by {setByName}
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="meeting-date"
                  className="block text-sm font-medium text-pink-700 mb-1"
                >
                  {currentDate ? 'Update meeting date' : 'Set meeting date'}
                </label>
                <input
                  type="date"
                  id="meeting-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-pink-200 rounded-lg text-pink-900 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300"
                />
              </div>

              <PinkButton type="submit" disabled={loading} className="w-full">
                {loading ? 'Saving...' : currentDate ? 'Update Date' : 'Set Date'}
              </PinkButton>
            </form>

            {message && (
              <div
                className={`mt-4 p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
                role="alert"
              >
                {message.text}
              </div>
            )}
          </>
        )}
      </PinkCard>

      {/* PWA & Offline App Section */}
      <PinkCard>
        <h2 className="text-lg font-semibold text-pink-800 mb-2 flex items-center gap-2">
          <span>📲</span> Mobile & Desktop App (PWA)
        </h2>
        <p className="text-xs text-pink-600 mb-4 leading-relaxed">
          Install DayByDay directly to your phone or desktop home screen for instant access and full offline support.
        </p>

        <PwaSettingsSection />
      </PinkCard>

      {/* Opening Heart Animation Section */}
      <PinkCard>
        <h2 className="text-lg font-semibold text-pink-800 mb-2 flex items-center gap-2">
          <span>❤️</span> Opening Heart Animation
        </h2>
        <p className="text-xs text-pink-600 mb-4 leading-relaxed">
          The romantic heart drawing animation composed of "I love you" notes. Set how often it plays when you open DayByDay.
        </p>

        <HeartAnimationSettingsSection />
      </PinkCard>

      {/* Offline Diary & Sync Section */}
      <PinkCard>
        <h2 className="text-lg font-semibold text-pink-800 mb-2 flex items-center gap-2">
          <span>📖</span> Offline Diary Storage & Sync
        </h2>
        <p className="text-xs text-pink-600 mb-4 leading-relaxed">
          Write diary entries anytime without internet. All offline entries are saved safely on your device and auto-sync when online.
        </p>

        <OfflineDiarySettingsSection />
      </PinkCard>

      {/* Logout */}
      <PinkCard>
        <h2 className="text-lg font-semibold text-pink-800 mb-4">Account</h2>
        <form action={logout}>
          <button
            type="submit"
            className="w-full px-4 py-2.5 rounded-xl border border-pink-300 text-pink-700 font-medium hover:bg-pink-50 transition-colors"
          >
            Log out
          </button>
        </form>
      </PinkCard>
    </div>
    </PageTransition>
  );
}

function PwaSettingsSection() {
  const { isInstalled, isStandalone, canPrompt, isIOS, isOnline, promptInstall } = usePwaInstall();
  const [showIosTip, setShowIosTip] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 bg-pink-50/80 rounded-xl border border-pink-100">
        <img
          src="/icons/icon-192.png"
          alt="DayByDay App Icon"
          className="w-12 h-12 rounded-xl shadow-sm border border-pink-200 object-cover flex-shrink-0"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-xs font-semibold text-pink-900">
              {isOnline ? 'Online & Ready' : 'Offline Mode Active'}
            </span>
          </div>
          <p className="text-[11px] text-pink-600 mt-0.5">
            Progressive Web App • Service Worker Active
          </p>
        </div>
      </div>

      {isStandalone || isInstalled ? (
        <div className="p-3 bg-green-50 rounded-xl border border-green-200 flex items-center gap-2 text-xs font-semibold text-green-800">
          <span>✨</span> DayByDay App is installed on this device!
        </div>
      ) : canPrompt ? (
        <PinkButton onClick={promptInstall} className="w-full text-xs py-2.5">
          Install DayByDay App
        </PinkButton>
      ) : isIOS ? (
        <div>
          <button
            onClick={() => setShowIosTip(!showIosTip)}
            className="w-full py-2.5 px-4 rounded-xl border border-pink-300 bg-pink-50 text-pink-700 text-xs font-semibold hover:bg-pink-100 transition-colors flex items-center justify-between"
          >
            <span>iPhone / iPad Installation Guide</span>
            <span>{showIosTip ? '▲' : '▼'}</span>
          </button>
          {showIosTip && (
            <div className="mt-2.5 p-3.5 bg-pink-50/80 rounded-xl border border-pink-200 text-xs text-pink-800 space-y-2">
              <p className="font-semibold">To install on iOS Safari:</p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-pink-700">
                <li>Tap the <strong>Share icon</strong> (square with up arrow) in Safari.</li>
                <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
              </ol>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 bg-pink-50 rounded-xl text-xs text-pink-700">
          Open this website in Chrome or Safari on your mobile device to install the app.
        </div>
      )}
    </div>
  );
}

function HeartAnimationSettingsSection() {
  const [mode, setMode] = useState('first_3');
  const [playCount, setPlayCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMode(localStorage.getItem('daybyday_heart_intro_mode') || 'first_3');
      setPlayCount(parseInt(localStorage.getItem('daybyday_heart_intro_count') || '0', 10));
    }
  }, []);

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    localStorage.setItem('daybyday_heart_intro_mode', newMode);
  };

  const handleResetCount = () => {
    localStorage.setItem('daybyday_heart_intro_count', '0');
    sessionStorage.removeItem('daybyday_heart_session_shown');
    setPlayCount(0);
  };

  const handlePreview = () => {
    window.dispatchEvent(new Event('daybyday-replay-heart-anim'));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 bg-pink-50/70 rounded-xl border border-pink-100">
        <div>
          <p className="text-xs font-semibold text-pink-900">Preview Heart Animation</p>
          <p className="text-[11px] text-pink-500">Play the glowing parametric &apos;I love you&apos; heart</p>
        </div>
        <button
          type="button"
          onClick={handlePreview}
          className="px-3.5 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1"
        >
          <span>💕</span> Preview
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-pink-800">Launch Frequency</label>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {[
            { id: 'first_3', label: 'First 3 Times' },
            { id: 'always', label: 'Every Open' },
            { id: 'never', label: 'Disabled' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleModeChange(opt.id)}
              className={`py-2 px-2 rounded-xl font-medium text-center border transition-all ${
                mode === opt.id
                  ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                  : 'bg-white text-pink-700 border-pink-200 hover:bg-pink-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-pink-500 pt-1">
        <span>Times played on launch: <strong>{playCount}</strong></span>
        <button
          type="button"
          onClick={handleResetCount}
          className="text-pink-600 hover:underline font-medium"
        >
          Reset Counter
        </button>
      </div>
    </div>
  );
}

function OfflineDiarySettingsSection() {
  const [cachedCount, setCachedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const refreshCounts = () => {
    setCachedCount(getCachedEntries().length);
    setPendingCount(getSyncQueue().length);
  };

  useEffect(() => {
    refreshCounts();
  }, []);

  const handleSync = async () => {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      setSyncMessage('Cannot sync: device is currently offline.');
      setTimeout(() => setSyncMessage(null), 3500);
      return;
    }
    setSyncing(true);
    setSyncMessage(null);
    const res = await syncPendingEntries();
    setSyncing(false);
    refreshCounts();
    if (res.syncedCount > 0) {
      setSyncMessage(`Successfully synced ${res.syncedCount} entries! 💕`);
    } else if (res.errors.length > 0) {
      setSyncMessage(`Sync error: ${res.errors[0]}`);
    } else {
      setSyncMessage('All offline entries are already up to date! ✨');
    }
    setTimeout(() => setSyncMessage(null), 4000);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-3 bg-pink-50/70 rounded-xl border border-pink-100 text-center">
          <p className="text-[11px] text-pink-500 font-medium">Cached Entries</p>
          <p className="text-lg font-bold text-pink-900 mt-0.5">{cachedCount}</p>
        </div>
        <div className="p-3 bg-pink-50/70 rounded-xl border border-pink-100 text-center">
          <p className="text-[11px] text-pink-500 font-medium">Pending Sync</p>
          <p className="text-lg font-bold text-pink-900 mt-0.5">{pendingCount}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        className="w-full py-2.5 px-4 rounded-xl bg-pink-500 hover:bg-pink-600 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        <span>{syncing ? '🔄' : '⚡'}</span>
        {syncing ? 'Syncing with Server...' : 'Sync Offline Entries Now'}
      </button>

      {syncMessage && (
        <p className="text-xs text-center font-medium text-pink-700 bg-pink-50 p-2 rounded-xl border border-pink-100">
          {syncMessage}
        </p>
      )}
    </div>
  );
}


