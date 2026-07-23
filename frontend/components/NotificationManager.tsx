'use client';

import { useEffect, useState } from 'react';
import { getProfile } from '@/actions/auth.actions';

// Helper function to send local notifications
export function sendLocalNotification(title: string, body: string) {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: '/images/timelineleft.png', // custom icon representing them
      });
      return true;
    } catch (e) {
      console.error("Failed to show notification:", e);
    }
  }
  return false;
}

export function requestNotificationPermission(callback?: (granted: boolean) => void) {
  if (!("Notification" in window)) {
    if (callback) callback(false);
    return;
  }
  
  Notification.requestPermission().then(permission => {
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
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [userRole, setUserRole] = useState<'vansh' | 'pakhi' | null>(null);

  useEffect(() => {
    if (!("Notification" in window)) return;
    setPermission(Notification.permission);
    
    // Auto request on mount if not determined yet
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(perm => setPermission(perm));
    }

    // Fetch user profile to identify who is logged in
    getProfile().then(profile => {
      if (profile) {
        if (profile.username === 'user1' || profile.email.includes('user1')) {
          setUserRole('vansh');
        } else {
          setUserRole('pakhi');
        }
      }
    }).catch(err => {
      console.error("Failed to load profile for NotificationManager", err);
    });
  }, []);

  useEffect(() => {
    if (permission !== 'granted' || !userRole) return;

    const checkSchedule = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

      // ============================================
      // VANSH'S SIDE (User 1) - PRIVACY MODE
      // ============================================
      if (userRole === 'vansh') {
        // ONLY trigger the 10:00 PM Calendar checklist reminder (completely generic, random message)
        if (hours === 22 && minutes === 0) {
          const body = getRotatedMessage(CALENDAR_POOLS_VANSH);
          sendLocalNotification("🗓️ Calendar Reminder", body);
        }
        return; // Skip all other notifications to guarantee privacy
      }

      // ============================================
      // PAKHI'S SIDE (User 2) - HOSTEL MODE
      // ============================================
      if (userRole === 'pakhi') {
        // 1. Morning Class Alert (10:00 AM, Wed, Thu, Fri, Sat, Sun, Mon)
        if (hours === 10 && minutes === 0) {
          if (dayName !== 'Tuesday') {
            let subject = "CS 451"; 
            let room = "JM 314";
            if (dayName === 'Wednesday' || dayName === 'Thursday') {
              subject = "BIO 418";
              room = "JM 104";
            }
            const body = getRotatedMessage(CLASS_POOLS_PAKHI, { subject, room });
            sendLocalNotification("📚 Class Time!", body);
          }
        }

        // 2. Evening Lab Alert (02:00 PM, Thursday, Sunday, Monday)
        if (hours === 14 && minutes === 0) {
          if (['Thursday', 'Sunday', 'Monday'].includes(dayName)) {
            let lab = "BIN 413L (Database)";
            if (dayName === 'Sunday') lab = "BIN 413L (C Programming)";
            if (dayName === 'Monday') lab = "BIN 413L (Operating System)";
            const body = getRotatedMessage(LAB_POOLS_PAKHI, { lab, room: "JM L-314" });
            sendLocalNotification("🔬 Lab Session Starting!", body);
          }
        }

        // 3. Evening Lab Completion Alert (06:00 PM, Thursday, Sunday, Monday)
        if (hours === 18 && minutes === 0) {
          if (['Thursday', 'Sunday', 'Monday'].includes(dayName)) {
            const body = getRotatedMessage(LAB_FINISHED_POOLS_PAKHI);
            sendLocalNotification("🥰 Lab is Over!", body);
          }
        }

        // 4. Talk Reminder (08:30 PM, Daily)
        if (hours === 20 && minutes === 30) {
          const body = getRotatedMessage(TALK_POOLS_PAKHI);
          sendLocalNotification("☎️ Talk Time!", body);
        }

        // 5. Calendar Checklist (10:00 PM, Daily)
        if (hours === 22 && minutes === 0) {
          const body = getRotatedMessage(CALENDAR_POOLS_PAKHI);
          sendLocalNotification("🗓️ Calendar Reminder", body);
        }

        // 6. Occasional Diary Prompt (09:30 PM, Wed, Sat, Mon)
        if (hours === 21 && minutes === 30) {
          if (['Wednesday', 'Saturday', 'Monday'].includes(dayName)) {
            const body = getRotatedMessage(DIARY_POOLS_PAKHI);
            sendLocalNotification("📖 Diary Reminder", body);
          }
        }
      }
    };

    // Check immediately and then every minute
    checkSchedule();
    const interval = setInterval(checkSchedule, 60000);
    return () => clearInterval(interval);
  }, [permission, userRole]);

  return null; // Silent logic-only component
}
