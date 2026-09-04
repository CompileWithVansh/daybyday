'use client';

import { useEffect, useState } from 'react';
import { PinkButton } from '@/components/PinkButton';
import { PinkCard } from '@/components/PinkCard';
import { PageTransition } from '@/components/PageTransition';
import { getMeetingDate, setMeetingDate } from '@/actions/meeting.actions';
import { logout, getProfile } from '@/actions/auth.actions';
import { usePwaInstall } from '@/lib/usePwaInstall';
import { getCachedEntries, getSyncQueue, syncPendingEntries } from '@/lib/offlineStorage';
import {
  getNotificationHistory,
  clearNotificationHistory,
  sendLocalNotification,
  requestNotificationPermission,
  getRotatedMessage,
  NotificationHistoryItem,
  CALENDAR_POOLS_VANSH,
  CALENDAR_POOLS_PAKHI,
  CLASS_POOLS_PAKHI,
  LAB_POOLS_PAKHI,
  LAB_FINISHED_POOLS_PAKHI,
  TALK_POOLS_PAKHI,
  DIARY_POOLS_PAKHI,
} from '@/components/NotificationManager';

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

      {/* Notifications & Schedule History Section */}
      <PinkCard>
        <h2 className="text-lg font-semibold text-pink-800 mb-2 flex items-center gap-2">
          <span>🔔</span> Notifications & Daily Schedule
        </h2>
        <p className="text-xs text-pink-600 mb-4 leading-relaxed">
          Daily timetable alerts for classes, labs, calls, and calendar checklists. Test random notification pools and review alert history.
        </p>

        <NotificationSettingsSection />
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

function NotificationSettingsSection() {
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const [userRole, setUserRole] = useState<'vansh' | 'pakhi' | null>(null);
  const [activeTab, setActiveTab] = useState<'test' | 'history'>('test');
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  const refreshHistory = () => {
    setHistory(getNotificationHistory());
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window)) {
      setPermission('unsupported');
    } else {
      setPermission(Notification.permission as 'default' | 'granted' | 'denied');
    }

    refreshHistory();

    getProfile()
      .then((profile) => {
        if (profile) {
          const id = `${profile.username || ''} ${profile.email || ''} ${profile.displayName || ''}`.toLowerCase();
          setUserRole(id.includes('vansh') ? 'vansh' : 'pakhi');
        }
      })
      .catch(() => {});

    const handleUpdate = () => refreshHistory();
    window.addEventListener('daybyday-notification-history-updated', handleUpdate);
    return () => window.removeEventListener('daybyday-notification-history-updated', handleUpdate);
  }, []);

  const handleEnablePermission = () => {
    requestNotificationPermission((granted) => {
      setPermission(granted ? 'granted' : 'denied');
      if (granted) {
        sendLocalNotification(
          '🎉 Notifications Enabled!',
          'DayByDay will send you lovely daily schedule reminders and prompts.'
        );
        refreshHistory();
      }
    });
  };

  const handleTest = async (title: string, body: string) => {
    setTestFeedback(`Fired: "${title}"`);
    await sendLocalNotification(title, body);
    refreshHistory();
    setTimeout(() => setTestFeedback(null), 3500);
  };

  const handleClearHistory = () => {
    clearNotificationHistory();
    refreshHistory();
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-4">
      {/* Permission Status */}
      <div className="p-3 bg-pink-50/80 rounded-xl border border-pink-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              permission === 'granted'
                ? 'bg-emerald-500'
                : permission === 'denied'
                ? 'bg-rose-500'
                : 'bg-amber-500 animate-pulse'
            }`}
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-pink-900 truncate">
              {permission === 'granted'
                ? 'System Notifications Active'
                : permission === 'denied'
                ? 'Notifications Blocked'
                : 'Permission Required'}
            </p>
            <p className="text-[11px] text-pink-600 truncate">
              {permission === 'granted'
                ? 'PWA Service Worker & in-app alerts active'
                : permission === 'denied'
                ? 'Unblock notifications in your browser settings'
                : 'Enable to receive scheduled college and love alerts'}
            </p>
          </div>
        </div>
        {permission !== 'granted' && permission !== 'unsupported' && (
          <button
            type="button"
            onClick={handleEnablePermission}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-[11px] font-semibold active:scale-95 transition-all shadow-sm"
          >
            Enable
          </button>
        )}
      </div>

      {/* User Role Banner */}
      <div className="px-3 py-2 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 rounded-xl border border-pink-200/70 flex items-center justify-between text-xs">
        <span className="text-pink-700 font-medium">
          Profile: <strong className="text-pink-900 capitalize">{userRole || 'Detecting...'}</strong>
        </span>
        <span className="text-[11px] text-pink-500 font-mono">
          {userRole === 'pakhi' ? 'Hostel Timetable Mode' : 'Privacy Mode'}
        </span>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-pink-200/80 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('test')}
          className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'test'
              ? 'border-pink-500 text-pink-700'
              : 'border-transparent text-pink-400 hover:text-pink-600'
          }`}
        >
          <span>🧪</span> Test Notification Pools
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-pink-500 text-pink-700'
              : 'border-transparent text-pink-400 hover:text-pink-600'
          }`}
        >
          <span>📜</span> History Log ({history.length})
        </button>
      </div>

      {/* Tab: Test Pools */}
      {activeTab === 'test' && (
        <div className="space-y-3">
          <p className="text-[11px] text-pink-600 leading-snug">
            Tap any button to test that notification pool right now. It picks a random message from the array, sends an in-app banner, and triggers a system notification:
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() =>
                handleTest(
                  '📚 Class Time!',
                  getRotatedMessage(CLASS_POOLS_PAKHI, { subject: 'BIO 418', room: 'JM 104' })
                )
              }
              className="p-2.5 bg-pink-50/80 hover:bg-pink-100/90 text-pink-800 rounded-xl border border-pink-200 text-left transition-all active:scale-[0.98]"
            >
              <div className="font-semibold flex items-center gap-1">
                <span>📚</span> Morning Class
              </div>
              <p className="text-[10px] text-pink-500 mt-0.5">10:00 AM - 1:00 PM</p>
            </button>

            <button
              type="button"
              onClick={() =>
                handleTest(
                  '🔬 Lab Session Starting!',
                  getRotatedMessage(LAB_POOLS_PAKHI, { lab: 'BIN 413L (Database)', room: 'JM L-314' })
                )
              }
              className="p-2.5 bg-pink-50/80 hover:bg-pink-100/90 text-pink-800 rounded-xl border border-pink-200 text-left transition-all active:scale-[0.98]"
            >
              <div className="font-semibold flex items-center gap-1">
                <span>🔬</span> Evening Lab
              </div>
              <p className="text-[10px] text-pink-500 mt-0.5">2:00 PM - 5:00 PM</p>
            </button>

            <button
              type="button"
              onClick={() => handleTest('🥰 Lab is Over!', getRotatedMessage(LAB_FINISHED_POOLS_PAKHI))}
              className="p-2.5 bg-pink-50/80 hover:bg-pink-100/90 text-pink-800 rounded-xl border border-pink-200 text-left transition-all active:scale-[0.98]"
            >
              <div className="font-semibold flex items-center gap-1">
                <span>🥰</span> Lab Finished
              </div>
              <p className="text-[10px] text-pink-500 mt-0.5">6:00 PM - 8:00 PM</p>
            </button>

            <button
              type="button"
              onClick={() => handleTest('☎️ Talk Time!', getRotatedMessage(TALK_POOLS_PAKHI))}
              className="p-2.5 bg-pink-50/80 hover:bg-pink-100/90 text-pink-800 rounded-xl border border-pink-200 text-left transition-all active:scale-[0.98]"
            >
              <div className="font-semibold flex items-center gap-1">
                <span>☎️</span> Evening Talk
              </div>
              <p className="text-[10px] text-pink-500 mt-0.5">8:30 PM - 10:00 PM</p>
            </button>

            <button
              type="button"
              onClick={() => handleTest('📖 Diary Reminder', getRotatedMessage(DIARY_POOLS_PAKHI))}
              className="p-2.5 bg-pink-50/80 hover:bg-pink-100/90 text-pink-800 rounded-xl border border-pink-200 text-left transition-all active:scale-[0.98]"
            >
              <div className="font-semibold flex items-center gap-1">
                <span>📖</span> Diary Prompt
              </div>
              <p className="text-[10px] text-pink-500 mt-0.5">Wed, Sat, Mon 9:30 PM</p>
            </button>

            <button
              type="button"
              onClick={() =>
                handleTest(
                  '🗓️ Calendar Reminder',
                  getRotatedMessage(userRole === 'vansh' ? CALENDAR_POOLS_VANSH : CALENDAR_POOLS_PAKHI)
                )
              }
              className="p-2.5 bg-pink-50/80 hover:bg-pink-100/90 text-pink-800 rounded-xl border border-pink-200 text-left transition-all active:scale-[0.98]"
            >
              <div className="font-semibold flex items-center gap-1">
                <span>🗓️</span> Calendar Check
              </div>
              <p className="text-[10px] text-pink-500 mt-0.5">10:00 PM Daily</p>
            </button>
          </div>

          {testFeedback && (
            <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 text-center font-medium animate-in fade-in">
              {testFeedback} (Check top of screen or device tray!)
            </div>
          )}
        </div>
      )}

      {/* Tab: History Log */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-pink-600 font-medium">
              {history.length === 0
                ? 'No alerts logged'
                : `${history.length} logged notification${history.length > 1 ? 's' : ''}`}
            </span>
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-[11px] text-pink-600 hover:text-pink-800 underline font-medium"
              >
                Clear History
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="p-6 text-center bg-pink-50/50 rounded-xl border border-pink-100 text-pink-500 text-xs space-y-1">
              <p className="text-2xl">💌</p>
              <p className="font-semibold text-pink-800">No Notification History Yet</p>
              <p className="text-[11px]">
                When scheduled notifications trigger or when you test them, they will be preserved here.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-xl border border-pink-100/90 shadow-sm text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-pink-900">{item.title}</span>
                    <span className="text-[10px] text-pink-400">{formatTimestamp(item.timestamp)}</span>
                  </div>
                  <p className="text-pink-700 text-[11px] italic leading-relaxed">
                    &ldquo;{item.body}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


