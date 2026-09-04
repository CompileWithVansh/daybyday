'use client';

import { useEffect, useState } from 'react';
import { getProfile } from '@/actions/auth.actions';

export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
}

const STORAGE_KEYS = {
  HISTORY: 'daybyday_notification_history',
  SENT_TODAY: 'daybyday_sent_notifications',
};

export function getNotificationHistory(): NotificationHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordNotificationHistory(title: string, body: string): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getNotificationHistory();
    const newItem: NotificationHistoryItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      body,
      timestamp: new Date().toISOString(),
    };
    const updated = [newItem, ...history.slice(0, 49)];
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    window.dispatchEvent(new Event('daybyday-notification-history-updated'));
  } catch (err) {
    console.error('Error recording notification history:', err);
  }
}

export function clearNotificationHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
  window.dispatchEvent(new Event('daybyday-notification-history-updated'));
}

// Helper function to send notifications (both system notification & in-app banner)
export async function sendLocalNotification(title: string, body: string): Promise<boolean> {
  // 1. Record in history
  recordNotificationHistory(title, body);

  // 2. Dispatch custom event for in-app alert banner
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('daybyday-inapp-notification', {
        detail: { title, body, timestamp: Date.now() },
      })
    );
  }

  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  if (Notification.permission === 'granted') {
    // 3. Try Service Worker showNotification (crucial for Chrome on Android / mobile PWAs)
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, {
            body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: `daybyday-${Date.now()}`,
          } as NotificationOptions);
          return true;
        }
      } catch (swErr) {
        console.warn('SW notification fallback:', swErr);
      }
    }

    // 4. Fallback to desktop window Notification
    try {
      new Notification(title, {
        body,
        icon: '/icons/icon-192.png',
      });
      return true;
    } catch (e) {
      console.warn('Window Notification fallback failed:', e);
    }
  }
  return false;
}

export function requestNotificationPermission(callback?: (granted: boolean) => void) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    if (callback) callback(false);
    return;
  }

  Notification.requestPermission().then((permission) => {
    if (callback) {
      callback(permission === 'granted');
    }
  });
}

// ==========================
// CALENDAR POOLS - VANSH
// ==========================
export const CALENDAR_POOLS_VANSH = [
  "One little box left... future us will thank you. ❤️",
  "Today's almost over. Don't forget our tiny tradition. 🗓️💕",
  "Before you disappear... tap today's calendar. 😉",
  "A completed calendar looks almost as cute as us. 🌸",
  "One tap, one memory, one more day closer. 🥹❤️",
  "Today's square is waiting for your touch. ✨",
  "Don't let today leave without a tiny memory. 💕",
  "One checkmark today, countless memories tomorrow. ❤️",
  "Keep our little streak alive. 🗓️",
  "Every completed day tells our story. 🥰",
  "Just one tap before bedtime. 🌙",
  "Another day, another memory worth keeping. 💖",
  "Make today's box feel loved too. 🌸",
  "Tiny traditions become beautiful memories. ✨",
  "Goodnight starts after one little check. 😊",
  "One more page added to our journey. ❤️",
  "Leave a little smile on today's date. 🥹",
  "The calendar misses you today. 😉",
  "Complete today with one final tap. 💕",
  "Every day counts when it's part of our story. ❤️"
];

// ==========================
// CALENDAR POOLS - PAKHI
// ==========================
export const CALENDAR_POOLS_PAKHI = [
  "Princess, don't forget today's calendar... I want every day with you counted. 💖",
  "One more box checked means one day closer to another hug. 🥹",
  "Before sleeping, leave today's little heart on the calendar for us. ❤️",
  "Our countdown misses your touch... mark today. 🌸",
  "Complete today's box, pretty girl. Future us is waiting. ✨",
  "Today's memory deserves its place. 🗓️",
  "One tiny tap. One unforgettable day. 💕",
  "Don't leave today's square feeling lonely. 🥺",
  "Every checked day is another page in our story. ❤️",
  "Today's box is waiting for you. 😊",
  "A little heart looks good on today's date. 💖",
  "Our countdown grows prettier because of you. 🌸",
  "Mark today with love before sleeping. 😴",
  "Let's keep our little tradition alive. ❤️",
  "Another day, another memory together. 🥹",
  "Every calendar square hides a smile. 😊",
  "Today's emoji is still waiting for you. ✨",
  "Fill today's square with happiness. 💕",
  "One more day complete. One more reason to smile. ❤️",
  "Don't forget today's tiny celebration. 🎉"
];

// ==========================
// CLASS POOLS
// ==========================
export const CLASS_POOLS_PAKHI = [
  "Go make {subject} jealous of how pretty you look today. 😉💕 (Room {room})",
  "Class time! {subject} in {room}. Learn well... I'll be waiting to hear all about it. ❤️",
  "Don't let {subject} steal all your attention. Save some for me. 🥺 (Room {room})",
  "Time for {subject}! Be the cutest student in Room {room}. 🌸",
  "Your classroom is lucky to have you today. 💖",
  "Ace {subject} like the queen you are. 👑",
  "Go collect knowledge... and come back to me. ❤️",
  "Make today's lecture proud. You're going to shine. ✨",
  "Your smile will outscore every lecture today. 😊",
  "One class closer to coming back and talking to me. 🥹",
  "Best of luck in {subject}! I'm already proud of you. 💕",
  "Don't forget to eat after class too. ❤️",
  "Go conquer Room {room}. 💪",
  "Learn something cool and tell me later. ☺️",
  "You're smarter than you think. Go prove it! 🌸",
  "Another lecture, another chance to impress everyone. 💖",
  "Focus now... I'll steal your attention later. 😉",
  "Class first, boyfriend later... I'll wait. ❤️",
  "Give your best in {subject}. You always amaze me. 🥰",
  "Go shine, pretty girl. 🌟"
];

// ==========================
// LAB POOLS
// ==========================
export const LAB_POOLS_PAKHI = [
  "Good luck in {lab}! Don't flirt with the bugs, they're not as cute as me. 😂❤️ (Room {room})",
  "{lab} is waiting in {room}. Show them who's the smartest and prettiest. 💕",
  "Lab time! Break the code, not your patience. I'll be cheering for you. 🥹",
  "Go ace {lab}. I'll be waiting for my post-lab stories. 🌸",
  "Debug everything except our love story. ❤️",
  "Good luck, engineer. You've got this. 💪",
  "Go make the compiler happy today. 😄",
  "Even bugs can't stop someone as amazing as you. 💖",
  "Lab first, cuddles later. 🥰",
  "Take a deep breath... you'll do great. ❤️",
  "May your code compile on the first try. 🤞",
  "If the code doesn't work, you're still my favorite. 💕",
  "One experiment closer to success. ✨",
  "Go show everyone how brilliant you are. 🌟",
  "The lab is lucky to have you today. 💖",
  "Hope today's practical goes smoother than expected. ☺️",
  "Room {room} is about to witness greatness. 😉",
  "You've survived tougher bugs than this. ❤️",
  "I'll be waiting for the success story afterward. 🥹",
  "Good luck! Don't forget to smile. 🌸"
];

// ==========================
// LAB FINISHED
// ==========================
export const LAB_FINISHED_POOLS_PAKHI = [
  "Yayy! You're free now... does that mean I get your attention? 🥹❤️",
  "Mission survived. Reward: one call with your favorite person. ☎️💕",
  "College is over. Now it's my turn to steal your time. 😉",
  "You made it! Come tell me how your day went, pretty girl. 🌸",
  "Lab defeated. Boyfriend unlocked. ❤️",
  "Finally free! Guess who missed you all afternoon? 🥺",
  "Time to replace assignments with conversations. 💕",
  "The hardest part is over. The best part starts now. ❤️",
  "Your favorite human is available now. 😉",
  "Freedom looks good on you. 🌸",
  "Good job today! I'm proud of you. ❤️",
  "Go grab some water... then come talk to me. 🥹",
  "You survived another day of college. 💖",
  "Welcome back, genius. 😊",
  "I officially claim your free time now. 😌",
  "Today's classes are over. Missing you isn't. ❤️",
  "You've earned a break... and a hug. 🤗",
  "Smile! Your day just got better. 💕",
  "I hope your first free notification is from me. 🥹",
  "Congratulations! You've unlocked boyfriend mode. ❤️"
];

// ==========================
// TALK POOLS
// ==========================
export const TALK_POOLS_PAKHI = [
  "📞 Your boyfriend has been staring at his phone... coincidence? ❤️",
  "I prescribe one phone call immediately. Side effects include smiling. 😉",
  "Come here, I miss your voice more than I'll admit. 🥺💕",
  "Emergency! Someone loves you and wants to hear you. ☎️❤️",
  "It's our favorite time of the day... you, me, and endless talking. 🌙💕",
  "My day isn't complete until I hear your voice. ❤️",
  "Breaking News: Vansh is officially missing you again. 🥹",
  "One call. Unlimited smiles. Deal? ☺️",
  "Guess who's waiting? (Hint: It's always me.) 💖",
  "Your voice > every playlist on my phone. 🎧❤️",
  "Stop making me miss you and just call already. 😤💕",
  "I saved today's best smile for when you pick up. 😊",
  "I don't need goodnight yet... I need your voice first. 🌙",
  "This notification is basically me asking for your attention. 🥺",
  "Can I borrow five minutes? I promise I'll return them with love. ❤️",
  "Daily reminder: You're my favorite person to talk to. 💕",
  "The phone feels lighter when your name pops up. ☎️",
  "Knock knock... your boyfriend is waiting. 🚪❤️",
  "Every evening is secretly just an excuse to hear you laugh. 🥹",
  "Tap me, then call me. Simple. 😉"
];

// ==========================
// DIARY POOLS
// ==========================
export const DIARY_POOLS_PAKHI = [
  "Write today's favorite memory... I hope I made the list. 🥹❤️",
  "Dear Diary, today someone loved me a little more... hopefully. 💕",
  "Save today's little moments. One day we'll read them together. 📖🌸",
  "Write one happy thing before sleeping... even if it's just 'Vansh annoyed me.' 😂❤️",
  "A few words today become beautiful memories tomorrow. ✨",
  "Today's story deserves at least one page. ❤️",
  "Don't let today's memories disappear. 📖",
  "Future Pakhi will thank present Pakhi for writing today. 💕",
  "Every love story needs a journal. ❤️",
  "Write one sentence. That's enough. 🌸",
  "One smile, one memory, one page. 😊",
  "Capture today's little happiness before it runs away. ✨",
  "Some days become unforgettable because we wrote them down. 💖",
  "Leave a little message for your future self. 🥹",
  "Tiny memories become precious with time. 📖",
  "Today's page is waiting for your handwriting. 💕",
  "Write before your pillow steals all your thoughts. 😴",
  "Today's chapter deserves a happy ending. ❤️",
  "One minute of writing. A lifetime of memories. 🌸",
  "Let's not lose today's beautiful moments. ✨"
];

// Random rotation helper
export function getRotatedMessage(pool: string[], replacements?: Record<string, string>): string {
  const index = Math.floor(Math.random() * pool.length);
  let message = pool[index];

  if (replacements) {
    Object.entries(replacements).forEach(([key, val]) => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), val);
    });
  }
  return message;
}

export default function NotificationManager() {
  const [userRole, setUserRole] = useState<'vansh' | 'pakhi' | null>(null);
  const [inAppAlert, setInAppAlert] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Auto request notification permission on first launch if default
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Identify role accurately
    getProfile()
      .then((profile) => {
        if (profile) {
          const identifier = `${profile.username || ''} ${profile.email || ''} ${profile.displayName || ''}`.toLowerCase();
          if (identifier.includes('vansh')) {
            setUserRole('vansh');
          } else {
            setUserRole('pakhi');
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load profile for NotificationManager', err);
      });

    // Listen for in-app alert events
    const handleInApp = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string; body: string }>;
      if (customEvent.detail) {
        setInAppAlert({
          title: customEvent.detail.title,
          body: customEvent.detail.body,
        });
      }
    };

    window.addEventListener('daybyday-inapp-notification', handleInApp);
    return () => window.removeEventListener('daybyday-inapp-notification', handleInApp);
  }, []);

  // Auto-dismiss in-app banner after 8 seconds
  useEffect(() => {
    if (!inAppAlert) return;
    const timer = setTimeout(() => {
      setInAppAlert(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [inAppAlert]);

  // Robust Schedule Checker
  useEffect(() => {
    if (!userRole) return;

    const checkAndTriggerSchedule = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
      const todayKey = now.toISOString().split('T')[0];

      // Read sent today record
      let sentToday: Record<string, boolean> = {};
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.SENT_TODAY);
        if (raw) {
          const parsed = JSON.parse(raw);
          sentToday = parsed[todayKey] || {};
        }
      } catch {
        sentToday = {};
      }

      const markSent = (type: string) => {
        sentToday[type] = true;
        try {
          localStorage.setItem(
            STORAGE_KEYS.SENT_TODAY,
            JSON.stringify({ [todayKey]: sentToday })
          );
        } catch {}
      };

      // ============================================
      // VANSH'S SIDE (User 1) - PRIVACY MODE
      // ============================================
      if (userRole === 'vansh') {
        // 10:00 PM Calendar checklist reminder (between 22:00 and 23:59)
        if (hours >= 22 && !sentToday['calendar_vansh']) {
          markSent('calendar_vansh');
          const body = getRotatedMessage(CALENDAR_POOLS_VANSH);
          sendLocalNotification('🗓️ Calendar Reminder', body);
        }
        return;
      }

      // ============================================
      // PAKHI'S SIDE (User 2) - HOSTEL MODE
      // ============================================
      if (userRole === 'pakhi') {
        // 1. Morning Class Alert (10:00 AM - 1:00 PM window)
        if (hours >= 10 && hours < 13 && !sentToday['class_pakhi']) {
          if (dayName !== 'Tuesday') {
            markSent('class_pakhi');
            let subject = 'CS 451';
            let room = 'JM 314';
            if (dayName === 'Wednesday' || dayName === 'Thursday') {
              subject = 'BIO 418';
              room = 'JM 104';
            }
            const body = getRotatedMessage(CLASS_POOLS_PAKHI, { subject, room });
            sendLocalNotification('📚 Class Time!', body);
          }
        }

        // 2. Evening Lab Alert (2:00 PM - 5:00 PM window)
        if (hours >= 14 && hours < 17 && !sentToday['lab_pakhi']) {
          if (['Thursday', 'Sunday', 'Monday'].includes(dayName)) {
            markSent('lab_pakhi');
            let lab = 'BIN 413L (Database)';
            if (dayName === 'Sunday') lab = 'BIN 413L (C Programming)';
            if (dayName === 'Monday') lab = 'BIN 413L (Operating System)';
            const body = getRotatedMessage(LAB_POOLS_PAKHI, { lab, room: 'JM L-314' });
            sendLocalNotification('🔬 Lab Session Starting!', body);
          }
        }

        // 3. Evening Lab Completion Alert (6:00 PM - 8:00 PM window)
        if (hours >= 18 && hours < 20 && !sentToday['lab_finished_pakhi']) {
          if (['Thursday', 'Sunday', 'Monday'].includes(dayName)) {
            markSent('lab_finished_pakhi');
            const body = getRotatedMessage(LAB_FINISHED_POOLS_PAKHI);
            sendLocalNotification('🥰 Lab is Over!', body);
          }
        }

        // 4. Talk Reminder (8:30 PM - 10:00 PM window)
        const isTalkTime = (hours === 20 && minutes >= 30) || hours === 21;
        if (isTalkTime && !sentToday['talk_pakhi']) {
          markSent('talk_pakhi');
          const body = getRotatedMessage(TALK_POOLS_PAKHI);
          sendLocalNotification('☎️ Talk Time!', body);
        }

        // 5. Occasional Diary Prompt (9:30 PM - 11:59 PM window on Wed, Sat, Mon)
        const isDiaryTime = (hours === 21 && minutes >= 30) || hours >= 22;
        if (isDiaryTime && !sentToday['diary_pakhi']) {
          if (['Wednesday', 'Saturday', 'Monday'].includes(dayName)) {
            markSent('diary_pakhi');
            const body = getRotatedMessage(DIARY_POOLS_PAKHI);
            sendLocalNotification('📖 Diary Reminder', body);
          }
        }

        // 6. Calendar Checklist (10:00 PM - 11:59 PM window)
        if (hours >= 22 && !sentToday['calendar_pakhi']) {
          markSent('calendar_pakhi');
          const body = getRotatedMessage(CALENDAR_POOLS_PAKHI);
          sendLocalNotification('🗓️ Calendar Reminder', body);
        }
      }
    };

    checkAndTriggerSchedule();
    const interval = setInterval(checkAndTriggerSchedule, 30000);
    return () => clearInterval(interval);
  }, [userRole]);

  if (!inAppAlert) return null;

  return (
    <aside
      aria-label="In-App Notification"
      className="fixed top-3 left-3 right-3 z-[99999] max-w-md mx-auto bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 text-white p-3.5 rounded-2xl shadow-2xl border border-white/25 flex items-start gap-3 animate-in slide-in-from-top-4 duration-300 backdrop-blur-sm"
    >
      <span className="text-2xl flex-shrink-0">💌</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-pink-100 font-sans">
            {inAppAlert.title}
          </h4>
          <span className="text-[10px] text-pink-200">Just now</span>
        </div>
        <p className="text-xs font-medium text-white mt-0.5 leading-snug">
          {inAppAlert.body}
        </p>
      </div>
      <button
        onClick={() => setInAppAlert(null)}
        className="text-pink-200 hover:text-white text-xs font-bold p-1 transition-colors"
        aria-label="Close notification banner"
      >
        ✕
      </button>
    </aside>
  );
}
