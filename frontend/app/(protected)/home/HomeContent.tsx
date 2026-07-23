'use client';

import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';
import { PinkCard } from '@/components/PinkCard';
import { CountdownDisplay } from '@/components/CountdownDisplay';
import { PhotoAnimation } from '@/components/PhotoAnimation';
import { ConfettiEffect } from '@/components/ConfettiEffect';
import { 
  sendLocalNotification, 
  requestNotificationPermission,
  getRotatedMessage,
  CALENDAR_POOLS_VANSH,
  CALENDAR_POOLS_PAKHI,
  CLASS_POOLS_PAKHI,
  LAB_POOLS_PAKHI,
  LAB_FINISHED_POOLS_PAKHI,
  TALK_POOLS_PAKHI,
  DIARY_POOLS_PAKHI
} from '@/components/NotificationManager';

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

          {/* Timetable Card Access */}
          <Link
            href="/timetable"
            className="flex items-center justify-between p-4 bg-white border border-pink-100 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-pink-50 text-pink-500 rounded-xl group-hover:bg-pink-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-pink-800 font-sans">Pakhi's College Timetable</p>
                <p className="text-[11px] text-pink-400 font-sans">Check class hours & free timings 🌸</p>
              </div>
            </div>
            <div className="text-pink-400 group-hover:text-pink-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </Link>

          {/* Test Notifications Panel (Only visible in local development environment) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-white border border-pink-100 rounded-2xl shadow-md p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-pink-50 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🔔</span>
                  <h3 className="text-xs font-bold text-pink-900 uppercase tracking-wider font-sans">
                    Notification Tester (Dev Only)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => requestNotificationPermission((granted) => {
                    if (granted) {
                      sendLocalNotification("🎉 Permission Granted!", "You will now receive college schedule alerts and romantic prompts.");
                    }
                  })}
                  className="text-[9px] font-bold text-pink-500 bg-pink-50 hover:bg-pink-100 px-2 py-1 rounded-lg transition-all"
                >
                  Enable Notifications
                </button>
              </div>
              
              <p className="text-[10px] text-pink-400 font-sans leading-tight">
                Test how notifications will pop up on your device. Click any button to fire the notification immediately:
              </p>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => sendLocalNotification("📚 Class Time! (For Pakhi)", getRotatedMessage(CLASS_POOLS_PAKHI, { subject: "BIO 418", room: "JM 104" }))}
                  className="py-1.5 px-2 bg-pink-50 text-pink-700 rounded-xl hover:bg-pink-100/75 font-bold font-sans text-center transition-all active:scale-95 border border-pink-100"
                >
                  10 AM Class (Pakhi)
                </button>
                <button
                  type="button"
                  onClick={() => sendLocalNotification("🔬 Lab Starting! (For Pakhi)", getRotatedMessage(LAB_POOLS_PAKHI, { lab: "BIN 413L (Database)", room: "JM L-314" }))}
                  className="py-1.5 px-2 bg-pink-50 text-pink-700 rounded-xl hover:bg-pink-100/75 font-bold font-sans text-center transition-all active:scale-95 border border-pink-100"
                >
                  2 PM Lab Start (Pakhi)
                </button>
                <button
                  type="button"
                  onClick={() => sendLocalNotification("🥰 Lab is Over! (For Pakhi)", getRotatedMessage(LAB_FINISHED_POOLS_PAKHI))}
                  className="py-1.5 px-2 bg-pink-50 text-pink-700 rounded-xl hover:bg-pink-100/75 font-bold font-sans text-center transition-all active:scale-95 border border-pink-100"
                >
                  6 PM Lab Over (Pakhi)
                </button>
                <button
                  type="button"
                  onClick={() => sendLocalNotification("☎️ Talk Time! (For Pakhi)", getRotatedMessage(TALK_POOLS_PAKHI))}
                  className="py-1.5 px-2 bg-pink-50 text-pink-700 rounded-xl hover:bg-pink-100/75 font-bold font-sans text-center transition-all active:scale-95 border border-pink-100"
                >
                  8:30 PM Talk (Pakhi)
                </button>
                <button
                  type="button"
                  onClick={() => sendLocalNotification("📖 Diary Reminder (For Pakhi)", getRotatedMessage(DIARY_POOLS_PAKHI))}
                  className="py-1.5 px-2 bg-pink-50 text-pink-700 rounded-xl hover:bg-pink-100/75 font-bold font-sans text-center transition-all active:scale-95 border border-pink-100 col-span-2"
                >
                  9:30 PM Diary Reminder (Pakhi)
                </button>
                <button
                  type="button"
                  onClick={() => sendLocalNotification("🗓️ Calendar Reminder (For Vansh)", getRotatedMessage(CALENDAR_POOLS_VANSH))}
                  className="py-1.5 px-2 bg-pink-50 text-pink-700 rounded-xl hover:bg-pink-100/75 font-bold font-sans text-center transition-all active:scale-95 border border-pink-100"
                >
                  10 PM Calendar (Vansh)
                </button>
                <button
                  type="button"
                  onClick={() => sendLocalNotification("🗓️ Calendar Reminder (For Pakhi)", getRotatedMessage(CALENDAR_POOLS_PAKHI))}
                  className="py-1.5 px-2 bg-pink-50 text-pink-700 rounded-xl hover:bg-pink-100/75 font-bold font-sans text-center transition-all active:scale-95 border border-pink-100"
                >
                  10 PM Calendar (Pakhi)
                </button>
              </div>
            </div>
          )}

          {/* Confetti when countdown hits 0 */}
          {daysRemaining === 0 && <ConfettiEffect />}
        </div>
      </div>
    </PageTransition>
  );
}
