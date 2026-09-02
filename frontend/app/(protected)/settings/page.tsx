'use client';

import { useEffect, useState } from 'react';
import { PinkButton } from '@/components/PinkButton';
import { PinkCard } from '@/components/PinkCard';
import { PageTransition } from '@/components/PageTransition';
import { getMeetingDate, setMeetingDate } from '@/actions/meeting.actions';
import { logout } from '@/actions/auth.actions';
import { usePwaInstall } from '@/lib/usePwaInstall';

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

