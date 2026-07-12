'use client';

import { useEffect, useState } from 'react';
import { PinkButton } from '@/components/PinkButton';
import { PinkCard } from '@/components/PinkCard';
import { PageTransition } from '@/components/PageTransition';
import { getMeetingDate, setMeetingDate } from '@/actions/meeting.actions';
import { logout } from '@/actions/auth.actions';

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
