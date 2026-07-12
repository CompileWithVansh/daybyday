'use client';

import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';
import { PinkCard } from '@/components/PinkCard';
import { CountdownDisplay } from '@/components/CountdownDisplay';
import { PhotoAnimation } from '@/components/PhotoAnimation';
import { ConfettiEffect } from '@/components/ConfettiEffect';

interface MeetingData {
  daysRemaining: number;
  photoPosition: number;
  meetingDateStr: string;
}

interface HomeContentProps {
  meetingData: MeetingData | null;
}

export function HomeContent({ meetingData }: HomeContentProps) {
  // No meeting date set — show prompt
  if (!meetingData) {
    return (
      <PageTransition>
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold text-pink-900 text-center">
              DayByDay 💕
            </h1>

            <PinkCard className="text-center space-y-4">
              <p className="text-pink-700 text-lg">
                No meeting date set yet!
              </p>
              <p className="text-pink-500 text-sm">
                Set your next meeting date to start the countdown and watch your
                photos come together. 🥰
              </p>
              <Link
                href="/settings"
                className="inline-block mt-4 px-6 py-2 bg-pink-500 text-white font-medium rounded-lg hover:bg-pink-600 transition-colors"
              >
                Set Meeting Date
              </Link>
            </PinkCard>
          </div>
        </div>
      </PageTransition>
    );
  }

  const { daysRemaining, photoPosition, meetingDateStr } = meetingData;
  const formattedDate = new Date(meetingDateStr + 'T00:00:00').toLocaleDateString(
    'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-5">
          <h1 className="text-xl sm:text-2xl font-bold text-pink-900 text-center">
            DayByDay 💕
          </h1>

          {/* Countdown + Photo in a gradient card */}
          <div className="bg-gradient-to-br from-pink-50 via-white to-pink-50 rounded-2xl shadow-lg border border-pink-100 p-5 space-y-4">
            <CountdownDisplay daysRemaining={daysRemaining} />
            <p className="text-center text-sm text-pink-400">
              {formattedDate}
            </p>
            <div className="border-t border-pink-100 pt-4">
              <PhotoAnimation position={photoPosition} />
            </div>
          </div>

          {/* Confetti when countdown hits 0 */}
          {daysRemaining === 0 && <ConfettiEffect />}
        </div>
      </div>
    </PageTransition>
  );
}
