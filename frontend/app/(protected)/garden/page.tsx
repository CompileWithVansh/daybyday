'use client';

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/PageTransition';
import {
  getGardenState,
  waterGarden,
  setGardenMood,
  setGardenChoice,
  nextGardenPrompt,
  getTodayDailyQuestion,
  answerDailyQuestion,
  GardenData,
  DailyQuestionData,
} from '@/actions/garden.actions';

// Romantic love surprises for Vansh & Pakhi
const ROMANTIC_SURPRISES = [
  {
    title: 'A Little Love Note 💌',
    message: 'Distance is just a test to see how far love can travel. And ours reaches past every horizon, straight to your heart.',
    author: 'Forever & Always 💕',
  },
  {
    title: 'A Sweet Reminder 🌸',
    message: 'Every flower blooming in our little world is like every day we have waited for each other: patient, enduring, and infinitely beautiful.',
    author: 'From your favorite person 🥰',
  },
  {
    title: 'Just for You 🌙',
    message: 'Whenever you have a long day, remember that you are someone’s favorite reason to smile and someone’s absolute safest place.',
    author: 'Wrapped in a warm hug 🤍',
  },
  {
    title: 'Our Journey 🌷',
    message: 'We have counted more than ninety days together and watched our photos draw closer every sunrise. The best day of our lives is almost here.',
    author: 'Until we meet again ❤️',
  },
  {
    title: 'A Little Secret ✨',
    message: 'In a crowded world of millions, my eyes will always search for you, and my heart will always choose you. Every single time.',
    author: 'With all my heart 🌹',
  },
  {
    title: 'Tonight’s Thought 🌟',
    message: 'No matter how many miles lie between us right now, we are looking at the exact same moon and breathing the exact same tomorrow.',
    author: 'Always yours 💫',
  },
];

// Playful "This or That" prompts
const THIS_OR_THAT_PROMPTS = [
  {
    id: 1,
    question: 'Our next perfect date...',
    optionA: { text: 'Ice cream walk 🍦', value: 'ice_cream' },
    optionB: { text: 'Cozy movie night 🍿', value: 'movie_night' },
  },
  {
    id: 2,
    question: 'Our favorite way to spend the morning...',
    optionA: { text: 'Sunrise together 🌅', value: 'sunrise' },
    optionB: { text: 'Sleeping in & late talks 🌙', value: 'sleep_in' },
  },
  {
    id: 3,
    question: 'A romantic surprise you love most...',
    optionA: { text: 'Fresh flowers 💐', value: 'flowers' },
    optionB: { text: 'Handwritten love notes 💌', value: 'love_notes' },
  },
  {
    id: 4,
    question: 'A dream weekend getaway...',
    optionA: { text: 'Sunny beach stroll 🏖️', value: 'beach' },
    optionB: { text: 'Misty mountain escape ⛰️', value: 'mountain' },
  },
  {
    id: 5,
    question: 'Dinner together when we meet...',
    optionA: { text: 'Cooking homemade pasta 🍳', value: 'cooking' },
    optionB: { text: 'Street food date & chats 🍕', value: 'street_food' },
  },
];

const MOOD_OPTIONS = [
  { label: 'Feeling good 🌸', value: 'good', flowerColor: '#f43f5e', icon: '🌸' },
  { label: 'Feeling hopeful 🌻', value: 'hopeful', flowerColor: '#eab308', icon: '🌻' },
  { label: 'Feeling quiet 🌙', value: 'quiet', flowerColor: '#8b5cf6', icon: '🌙' },
  { label: 'Having a hard day 🌧️', value: 'difficult', flowerColor: '#60a5fa', icon: '🌧️' },
  { label: 'Feeling loved 🤍', value: 'loved', flowerColor: '#ec4899', icon: '🤍' },
];

interface PlantItem {
  id: number;
  variety: 'rose' | 'tulip' | 'daisy' | 'lavender' | 'bluebell' | 'marigold' | 'sprout' | 'starlight';
  color: string;
  left: string;
  bottom: string;
  scale: number;
  swayType: 'normal' | 'slow';
  height: number;
  name: string;
}

// 36 natural plant positions spanning the ground and path border
const GARDEN_GROUND_PLANTS: PlantItem[] = [
  // Front Foreground Row (bottom 1% to 4%)
  { id: 1, variety: 'rose', color: '#f43f5e', left: '3%', bottom: '1.5%', scale: 1.15, swayType: 'normal', height: 46, name: 'Velvet Rose' },
  { id: 2, variety: 'sprout', color: '#10b981', left: '8%', bottom: '2%', scale: 0.9, swayType: 'slow', height: 32, name: 'Baby Sprout' },
  { id: 3, variety: 'tulip', color: '#ec4899', left: '14%', bottom: '1%', scale: 1.2, swayType: 'slow', height: 50, name: 'Pink Tulip' },
  { id: 4, variety: 'daisy', color: '#fef08a', left: '20%', bottom: '2.5%', scale: 1.05, swayType: 'normal', height: 42, name: 'Sun Daisy' },
  { id: 5, variety: 'bluebell', color: '#38bdf8', left: '27%', bottom: '1.5%', scale: 1.1, swayType: 'slow', height: 44, name: 'Sky Bluebell' },
  { id: 6, variety: 'sprout', color: '#34d399', left: '33%', bottom: '2%', scale: 0.85, swayType: 'normal', height: 30, name: 'Dew Sprout' },
  { id: 7, variety: 'lavender', color: '#a855f7', left: '39%', bottom: '1%', scale: 1.15, swayType: 'slow', height: 48, name: 'Sweet Lavender' },
  { id: 8, variety: 'rose', color: '#fb7185', left: '46%', bottom: '2.5%', scale: 1.1, swayType: 'normal', height: 44, name: 'Blush Rose' },
  { id: 9, variety: 'marigold', color: '#f59e0b', left: '52%', bottom: '1.5%', scale: 1.2, swayType: 'slow', height: 46, name: 'Golden Marigold' },
  { id: 10, variety: 'sprout', color: '#10b981', left: '58%', bottom: '2%', scale: 0.9, swayType: 'normal', height: 32, name: 'Little Seedling' },
  { id: 11, variety: 'daisy', color: '#fef08a', left: '64%', bottom: '1%', scale: 1.05, swayType: 'slow', height: 40, name: 'Starlight Daisy' },
  { id: 12, variety: 'bluebell', color: '#60a5fa', left: '71%', bottom: '2.5%', scale: 1.15, swayType: 'normal', height: 46, name: 'Twilight Bluebell' },
  { id: 13, variety: 'tulip', color: '#f43f5e', left: '78%', bottom: '1.5%', scale: 1.1, swayType: 'slow', height: 48, name: 'Ruby Tulip' },
  { id: 14, variety: 'sprout', color: '#34d399', left: '85%', bottom: '2%', scale: 0.85, swayType: 'normal', height: 30, name: 'Hope Seedling' },
  { id: 15, variety: 'lavender', color: '#c084fc', left: '92%', bottom: '1%', scale: 1.15, swayType: 'slow', height: 48, name: 'Misty Lavender' },

  // Mid-ground Blossom Carpet (bottom 5% to 9%)
  { id: 16, variety: 'starlight', color: '#55DDF0', left: '6%', bottom: '6%', scale: 0.95, swayType: 'slow', height: 38, name: 'Cyan Glow' },
  { id: 17, variety: 'rose', color: '#ec4899', left: '12%', bottom: '7.5%', scale: 0.9, swayType: 'normal', height: 40, name: 'Petal Rose' },
  { id: 18, variety: 'daisy', color: '#fbbf24', left: '17%', bottom: '6.5%', scale: 0.85, swayType: 'slow', height: 36, name: 'Sunny Daisy' },
  { id: 19, variety: 'sprout', color: '#10b981', left: '24%', bottom: '7%', scale: 0.75, swayType: 'normal', height: 28, name: 'Green Sprout' },
  { id: 20, variety: 'bluebell', color: '#38bdf8', left: '30%', bottom: '6%', scale: 0.9, swayType: 'slow', height: 38, name: 'Fairy Bell' },
  { id: 21, variety: 'starlight', color: '#55DDF0', left: '42%', bottom: '7.5%', scale: 0.85, swayType: 'normal', height: 36, name: 'Night Blossom' },
  { id: 22, variety: 'marigold', color: '#f59e0b', left: '49%', bottom: '6%', scale: 0.9, swayType: 'slow', height: 38, name: 'Warm Amber' },
  { id: 23, variety: 'sprout', color: '#34d399', left: '55%', bottom: '7%', scale: 0.8, swayType: 'normal', height: 28, name: 'Joy Sprout' },
  { id: 24, variety: 'tulip', color: '#fb7185', left: '61%', bottom: '6.5%', scale: 0.9, swayType: 'slow', height: 40, name: 'Coral Tulip' },
  { id: 25, variety: 'lavender', color: '#a855f7', left: '67%', bottom: '7%', scale: 0.85, swayType: 'normal', height: 38, name: 'Purple Whisper' },
  { id: 26, variety: 'rose', color: '#f43f5e', left: '75%', bottom: '6%', scale: 0.95, swayType: 'slow', height: 42, name: 'Scarlet Rose' },
  { id: 27, variety: 'daisy', color: '#fef08a', left: '82%', bottom: '7.5%', scale: 0.85, swayType: 'normal', height: 36, name: 'Moon Daisy' },
  { id: 28, variety: 'starlight', color: '#55DDF0', left: '89%', bottom: '6.5%', scale: 0.9, swayType: 'slow', height: 38, name: 'Glow Star' },

  // Path border and background clusters (bottom 10% to 15%)
  { id: 29, variety: 'sprout', color: '#10b981', left: '10%', bottom: '11%', scale: 0.75, swayType: 'normal', height: 28, name: 'Garden Sprout' },
  { id: 30, variety: 'tulip', color: '#c084fc', left: '22%', bottom: '11.5%', scale: 0.8, swayType: 'slow', height: 34, name: 'Lilac Tulip' },
  { id: 31, variety: 'bluebell', color: '#38bdf8', left: '35%', bottom: '12%', scale: 0.8, swayType: 'normal', height: 34, name: 'Azure Bell' },
  { id: 32, variety: 'marigold', color: '#f59e0b', left: '66%', bottom: '11.5%', scale: 0.8, swayType: 'slow', height: 34, name: 'Copper Marigold' },
  { id: 33, variety: 'rose', color: '#fb7185', left: '79%', bottom: '12%', scale: 0.8, swayType: 'normal', height: 34, name: 'Dawn Rose' },
  { id: 34, variety: 'starlight', color: '#55DDF0', left: '86%', bottom: '11%', scale: 0.75, swayType: 'slow', height: 30, name: 'Gleam Flower' },
  { id: 35, variety: 'sprout', color: '#34d399', left: '28%', bottom: '14%', scale: 0.7, swayType: 'normal', height: 26, name: 'Path Sprout' },
  { id: 36, variety: 'daisy', color: '#fef08a', left: '73%', bottom: '14%', scale: 0.7, swayType: 'slow', height: 26, name: 'Little Daisy' },
];

interface BirdItem {
  id: number;
  top: string;
  left: string;
  color: string;
  delay: string;
  dur: string;
  size: number;
}

const GARDEN_BIRDS: BirdItem[] = [
  { id: 1, top: '15%', left: '24%', color: '#55DDF0', delay: '0s', dur: '6s', size: 18 },
  { id: 2, top: '22%', left: '70%', color: '#FFD28A', delay: '1.4s', dur: '7s', size: 16 },
  { id: 3, top: '10%', left: '76%', color: '#F2A8C8', delay: '2.8s', dur: '5.5s', size: 15 },
  { id: 4, top: '28%', left: '34%', color: '#55DDF0', delay: '0.8s', dur: '6.5s', size: 17 },
  { id: 5, top: '18%', left: '46%', color: '#E0E7FF', delay: '3.1s', dur: '8s', size: 16 },
];

type ActivePanel = 'none' | 'garden' | 'question' | 'this_or_that' | 'mood' | 'surprise';

export default function GardenPage() {
  const [garden, setGarden] = useState<GardenData | null>(null);
  const [dailyQuestion, setDailyQuestion] = useState<DailyQuestionData | null>(null);
  const [isWorldMode, setIsWorldMode] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [isWatering, setIsWatering] = useState(false);
  const [surpriseIndex, setSurpriseIndex] = useState(0);
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);
  const [tappedFlowerId, setTappedFlowerId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load state on mount
  useEffect(() => {
    let mounted = true;
    getGardenState().then((res) => {
      if (mounted && res.data) {
        setGarden(res.data);
      }
    });
    getTodayDailyQuestion().then((res) => {
      if (mounted && res.data) {
        setDailyQuestion(res.data);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const showFeedback = (text: string) => {
    setActiveFeedback(text);
    setTimeout(() => {
      setActiveFeedback((prev) => (prev === text ? null : prev));
    }, 3200);
  };

  // Water Garden Handler
  const handleWater = () => {
    if (isWatering) return;
    setIsWatering(true);

    startTransition(async () => {
      const res = await waterGarden();
      if (res.data) {
        setGarden(res.data);
      }
      setTimeout(() => {
        setIsWatering(false);
        showFeedback('You nourished our little garden with fresh water! 💧🌸');
      }, 1000);
    });
  };

  // Mood Selection Handler
  const handleSelectMood = (moodLabel: string) => {
    startTransition(async () => {
      const res = await setGardenMood(moodLabel);
      if (res.data) {
        setGarden(res.data);
        showFeedback(`Your mood flower is blooming: ${moodLabel}`);
      }
    });
  };

  // This or That Choice Handler
  const handleSelectChoice = (choice: string) => {
    startTransition(async () => {
      const res = await setGardenChoice(currentPrompt.id, choice);
      if (res.data) {
        setGarden(res.data);
        showFeedback('Your answer is saved! ✨');
      }
    });
  };

  // Next This or That Prompt Handler
  const handleNextPrompt = () => {
    startTransition(async () => {
      const nextId = (currentPrompt.id % THIS_OR_THAT_PROMPTS.length) + 1;
      const res = await nextGardenPrompt(nextId);
      if (res.data) {
        setGarden(res.data);
      }
    });
  };

  // Daily Question Answer Handler
  const handleAnswerDailyQuestion = (selectedOption: string) => {
    if (!dailyQuestion) return;
    startTransition(async () => {
      const res = await answerDailyQuestion(selectedOption);
      if (res.data) {
        setDailyQuestion(res.data);
        showFeedback('Your question answer is saved 💗');
      }
    });
  };

  const currentPrompt = useMemo(() => {
    const id = garden?.currentPromptId || 1;
    return THIS_OR_THAT_PROMPTS.find((p) => p.id === id) || THIS_OR_THAT_PROMPTS[0];
  }, [garden?.currentPromptId]);

  // Growth Stage calculation based on water count
  const growthStage = useMemo(() => {
    const count = garden?.waterCount ?? 5;
    if (count < 2) return { stage: 'Seed', icon: '🌱', label: 'Sprouting from earth' };
    if (count < 5) return { stage: 'Sprout', icon: '🌿', label: 'Growing with care' };
    if (count < 10) return { stage: 'Bud', icon: '🌷', label: 'Budding gently' };
    return { stage: 'Bloom', icon: '🌸', label: 'Full radiant bloom' };
  }, [garden?.waterCount]);

  // Tap a flower effect
  const handleFlowerTap = (id: number) => {
    setTappedFlowerId(id);
    setTimeout(() => setTappedFlowerId(null), 800);
  };

  return (
    <>
      {/* =========================================================================
          VIEW 1: GARDEN ENTRANCE PAGE (Matching Reference Screenshot & PWA Nav)
         ========================================================================= */}
      {!isWorldMode && (
        <PageTransition>
          <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-start p-4 max-w-md mx-auto space-y-5 pb-20">
            {/* Top Back Nav & Title */}
            <div className="w-full flex items-center justify-between pt-1">
              <Link
                href="/home"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-600 hover:text-pink-700 bg-pink-50/80 px-3 py-1.5 rounded-full border border-pink-100 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Back to Home
              </Link>
              <span className="text-xs font-bold text-pink-500 bg-pink-100/60 px-3 py-1 rounded-full flex items-center gap-1">
                <span>💧</span> {garden?.waterCount ?? 5} drops
              </span>
            </div>

            {/* The Main Entrance Card — Our Little World */}
            <div className="w-full bg-[#101A32] text-white rounded-3xl p-5 border border-indigo-950/60 shadow-xl overflow-hidden relative group">
              {/* Subtle ambient light glows */}
              <div className="absolute -top-16 -right-16 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-[#55DDF0]/10 rounded-full blur-3xl pointer-events-none" />

              <p className="text-[10px] font-bold tracking-widest uppercase text-indigo-300 font-sans mb-1">
                DAYBYDAY · OUR LITTLE WORLD
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-1.5">
                A little place for us.
              </h2>
              <p className="text-xs text-indigo-200/80 leading-relaxed font-sans mb-4">
                Every answer plants a seed. Every memory makes it bloom.
              </p>

              {/* Clickable illustrated artwork to enter full-screen world */}
              <button
                type="button"
                onClick={() => setIsWorldMode(true)}
                className="w-full text-left relative rounded-2xl overflow-hidden border border-indigo-800/40 shadow-inner group/art block focus:outline-none focus:ring-2 focus:ring-[#55DDF0]"
                aria-label="Enter full-screen Our Little World"
              >
                <img
                  src="/images/garden_world.jpg"
                  alt="Our Little World Night Scenery"
                  className="w-full h-52 sm:h-60 object-cover group-hover/art:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101A32]/80 via-transparent to-transparent pointer-events-none" />

                {/* Bottom-left rosebud pill */}
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-medium text-cyan-200 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#55DDF0] animate-pulse" />
                  <span>rosebud</span>
                </div>

                {/* Bottom-right Enter button */}
                <div className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-full bg-indigo-900/90 backdrop-blur-md border border-cyan-400/40 text-xs font-bold text-cyan-200 flex items-center gap-1.5 shadow-lg group-hover/art:bg-cyan-500 group-hover/art:text-slate-900 transition-all">
                  <span>Step Inside</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </button>

              {/* Two Compact Previews Below Artwork */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsWorldMode(true);
                    setActivePanel('garden');
                  }}
                  className="p-3.5 bg-[#172744] hover:bg-[#1f345c] active:scale-[0.98] border border-indigo-800/40 rounded-2xl transition-all group/item flex flex-col justify-between text-left"
                >
                  <div className="text-[#55DDF0] mb-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M12 2.25c.966 0 1.838.39 2.464 1.018a3.486 3.486 0 013.268.72 3.5 3.5 0 011.018 2.464 3.486 3.486 0 01.72 3.268 3.5 3.5 0 01-1.018 2.464 3.486 3.486 0 01-.72 3.268 3.5 3.5 0 01-2.464 1.018 3.486 3.486 0 01-3.268.72 3.5 3.5 0 01-2.464-1.018 3.486 3.486 0 01-3.268-.72 3.5 3.5 0 01-1.018-2.464 3.486 3.486 0 01-.72-3.268 3.5 3.5 0 011.018-2.464 3.486 3.486 0 01.72-3.268 3.5 3.5 0 012.464-1.018 3.486 3.486 0 013.268-.72c.626-.628 1.498-1.018 2.464-1.018zm0 6a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover/item:text-[#55DDF0] transition-colors font-sans">
                      Our Garden
                    </p>
                    <p className="text-[11px] text-indigo-300 font-sans mt-0.5">
                      Watch it grow
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsWorldMode(true);
                    setActivePanel('question');
                  }}
                  className="p-3.5 bg-[#172744] hover:bg-[#1f345c] active:scale-[0.98] border border-indigo-800/40 rounded-2xl transition-all group/item flex flex-col justify-between text-left"
                >
                  <div className="text-pink-400 mb-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover/item:text-pink-300 transition-colors font-sans">
                      Today&apos;s Question
                    </p>
                    <p className="text-[11px] text-indigo-300 font-sans mt-0.5">
                      Answer together
                    </p>
                  </div>
                </button>
              </div>

              {/* Enter Button CTA */}
              <button
                type="button"
                onClick={() => setIsWorldMode(true)}
                className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white font-bold text-xs tracking-wide shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <span>Enter Our Living World</span>
                <span>🌙✨</span>
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-pink-100 shadow-sm flex items-center justify-around text-center text-xs">
              <div>
                <p className="text-[10px] text-pink-400 uppercase font-bold tracking-wider font-sans">Growth</p>
                <p className="font-bold text-pink-900 mt-0.5 flex items-center justify-center gap-1 font-sans">
                  <span>{growthStage.icon}</span> {growthStage.stage}
                </p>
              </div>
              <div className="h-7 w-px bg-pink-100" />
              <div>
                <p className="text-[10px] text-pink-400 uppercase font-bold tracking-wider font-sans">Nourished</p>
                <p className="font-bold text-pink-900 mt-0.5 font-sans">
                  {garden?.waterCount ?? 5} times 💧
                </p>
              </div>
              <div className="h-7 w-px bg-pink-100" />
              <div>
                <p className="text-[10px] text-pink-400 uppercase font-bold tracking-wider font-sans">Moods</p>
                <p className="font-bold text-pink-900 mt-0.5 font-sans">
                  {garden?.pakhiMood?.split(' ')[0] || '🌸'} & {garden?.vanshMood?.split(' ')[0] || '🌷'}
                </p>
              </div>
            </div>
          </div>
        </PageTransition>
      )}

      {/* =========================================================================
          VIEW 2: THE IMMERSIVE FULL-SCREEN LIVING WORLD (The Garden IS the Interface)
         ========================================================================= */}
      <AnimatePresence>
        {isWorldMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="fixed inset-0 z-[60] w-full h-[100dvh] overflow-hidden bg-[#0A1020] select-none touch-manipulation"
          >
            {/* Ambient Background Scenery Artwork */}
            <div className="absolute inset-0 w-full h-full">
              <img
                src="/images/garden_world.jpg"
                alt="Our Little World"
                className="w-full h-full object-cover object-center pointer-events-none"
              />
              {/* Deep atmospheric evening tint overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#0A1020]/40 via-transparent to-[#0A1020]/75 pointer-events-none" />
            </div>

            {/* Living Layer 1: Fireflies Floating Across Scenery */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[
                { top: '22%', left: '15%', delay: '0s', dur: '5s', color: '#55DDF0' },
                { top: '38%', left: '72%', delay: '1.2s', dur: '6s', color: '#FFD28A' },
                { top: '55%', left: '30%', delay: '2.5s', dur: '4.5s', color: '#55DDF0' },
                { top: '68%', left: '80%', delay: '0.8s', dur: '5.5s', color: '#FFD28A' },
                { top: '45%', left: '48%', delay: '3.1s', dur: '7s', color: '#55DDF0' },
                { top: '78%', left: '22%', delay: '1.9s', dur: '6.2s', color: '#F2A8C8' },
                { top: '30%', left: '60%', delay: '2.1s', dur: '5.8s', color: '#FFD28A' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="firefly-particle absolute w-2 h-2 rounded-full"
                  style={{
                    top: item.top,
                    left: item.left,
                    backgroundColor: item.color,
                    boxShadow: `0 0 10px ${item.color}, 0 0 18px ${item.color}`,
                    animation: `firefly-float ${item.dur} ease-in-out infinite`,
                    animationDelay: item.delay,
                  }}
                />
              ))}
            </div>

            {/* Living Layer 2: Cozy Warm Cottage Window Glow */}
            <div
              className="cottage-glowing absolute pointer-events-none rounded-xl"
              style={{
                top: '40%',
                right: '12%',
                width: '18%',
                height: '14%',
                backgroundColor: 'rgba(255, 210, 138, 0.22)',
                filter: 'blur(16px)',
                animation: 'cottage-glow 3.5s ease-in-out infinite',
              }}
            />

            {/* Living Layer 3: Magical Cyan Fountain Glow & Water Ripple */}
            <div
              className="fountain-pulsing absolute pointer-events-none rounded-full"
              style={{
                bottom: '22%',
                left: '12%',
                width: '26%',
                height: '24%',
                backgroundColor: 'rgba(85, 221, 240, 0.18)',
                filter: 'blur(20px)',
                animation: 'fountain-pulse 4s ease-in-out infinite',
              }}
            />

            {/* Living Layer: Fluttering Night Birds & Butterflies in the Sky */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-25">
              {GARDEN_BIRDS.slice(0, Math.min(GARDEN_BIRDS.length, Math.max(2, Math.floor((garden?.waterCount ?? 5) / 2)))).map((b) => (
                <div
                  key={b.id}
                  className="creature-fluttering absolute pointer-events-none"
                  style={{
                    top: b.top,
                    left: b.left,
                    animation: `creature-drift ${b.dur} ease-in-out infinite`,
                    animationDelay: b.delay,
                  }}
                >
                  <div
                    style={{
                      animation: 'wing-flap 0.65s ease-in-out infinite',
                      filter: `drop-shadow(0 0 6px ${b.color})`,
                    }}
                  >
                    <svg width={b.size} height={b.size * 0.75} viewBox="0 0 20 15" fill="none">
                      <path d="M10 7.5 Q3 0 1 5.5 Q1 11.5 10 8.5" fill={b.color} opacity="0.95" />
                      <path d="M10 7.5 Q17 0 19 5.5 Q19 11.5 10 8.5" fill={b.color} opacity="0.95" />
                      <circle cx="10" cy="7.5" r="1.3" fill="#ffffff" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Living Layer 4: Progressive Carpet of Seeds, Sprouts & Blooming Flowers */}
            <div className="absolute inset-x-0 bottom-0 h-44 pointer-events-auto z-20 overflow-hidden">
              {GARDEN_GROUND_PLANTS.slice(
                0,
                Math.min(GARDEN_GROUND_PLANTS.length, Math.max(14, 10 + (garden?.waterCount ?? 5) * 2))
              ).map((pl) => (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => handleFlowerTap(pl.id)}
                  className={`flower-swaying absolute flex flex-col items-center group cursor-pointer focus:outline-none transition-transform active:scale-125 ${
                    tappedFlowerId === pl.id ? 'scale-125 animate-bounce' : ''
                  }`}
                  style={{
                    left: pl.left,
                    bottom: pl.bottom,
                    transform: `scale(${pl.scale})`,
                    animation: `${pl.swayType === 'normal' ? 'flower-sway' : 'flower-sway-slow'} ${2.8 + (pl.id % 4) * 0.4}s ease-in-out infinite`,
                    animationDelay: `${(pl.id % 5) * 0.3}s`,
                  }}
                  title={`${pl.name} • Tap to smile 💕`}
                  aria-label={`Tap ${pl.name}`}
                >
                  {tappedFlowerId === pl.id && (
                    <span className="text-xs mb-1 animate-fade-in-up">
                      {pl.variety === 'sprout' ? '🌱' : pl.variety === 'rose' ? '🌹' : '💕'}
                    </span>
                  )}

                  {/* 1. Sprout Variety: Tender double leaf with glowing dewdrop */}
                  {pl.variety === 'sprout' && (
                    <svg width="22" height={pl.height} viewBox="0 0 22 36" fill="none">
                      <path d="M11 14 Q12 25 11 36" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" />
                      <path d="M11 18 C5 12 5 7 11 10" fill="#10b981" />
                      <path d="M11 18 C17 12 17 7 11 10" fill="#34d399" />
                      <circle cx="11" cy="9.5" r="1.8" fill="#55DDF0" opacity="0.9" />
                    </svg>
                  )}

                  {/* 2. Rose Variety: Radiant multi-petal blossom */}
                  {pl.variety === 'rose' && (
                    <svg width="26" height={pl.height} viewBox="0 0 26 48" fill="none">
                      <path d="M13 17 Q15 32 13 48" stroke="#10b981" strokeWidth="2.3" strokeLinecap="round" />
                      <path d="M13 32 Q7 26 9 22 Q12 26 13 28" fill="#059669" />
                      <circle cx="13" cy="11" r="4.5" fill="#fef08a" />
                      <circle cx="8.5" cy="9.5" r="4" fill={pl.color} opacity="0.9" />
                      <circle cx="17.5" cy="9.5" r="4" fill={pl.color} opacity="0.9" />
                      <circle cx="10" cy="5.5" r="4" fill={pl.color} opacity="0.9" />
                      <circle cx="16" cy="5.5" r="4" fill={pl.color} opacity="0.9" />
                      <circle cx="13" cy="13" r="3.8" fill={pl.color} opacity="0.95" />
                    </svg>
                  )}

                  {/* 3. Tulip Variety: Elegant curved goblet flower */}
                  {pl.variety === 'tulip' && (
                    <svg width="24" height={pl.height} viewBox="0 0 24 48" fill="none">
                      <path d="M12 17 Q13 32 12 48" stroke="#059669" strokeWidth="2.3" strokeLinecap="round" />
                      <path d="M12 33 Q17 27 15 23 Q13 27 12 29" fill="#10b981" />
                      <path d="M12 5 C7 5 5 15 12 21 C19 15 17 5 12 5 Z" fill={pl.color} />
                      <path d="M12 7 C10 7 8 13 12 18 C16 13 14 7 12 7 Z" fill="#ffffff" opacity="0.32" />
                    </svg>
                  )}

                  {/* 4. Daisy Variety: Starburst radiating petals */}
                  {pl.variety === 'daisy' && (
                    <svg width="26" height={pl.height} viewBox="0 0 26 46" fill="none">
                      <path d="M13 15 Q14 30 13 46" stroke="#10b981" strokeWidth="2.1" strokeLinecap="round" />
                      <circle cx="13" cy="13" r="3.2" fill="#f59e0b" />
                      <circle cx="13" cy="5.5" r="3" fill={pl.color} />
                      <circle cx="13" cy="20.5" r="3" fill={pl.color} />
                      <circle cx="5.5" cy="13" r="3" fill={pl.color} />
                      <circle cx="20.5" cy="13" r="3" fill={pl.color} />
                      <circle cx="7.5" cy="7.5" r="2.8" fill={pl.color} />
                      <circle cx="18.5" cy="7.5" r="2.8" fill={pl.color} />
                      <circle cx="7.5" cy="18.5" r="2.8" fill={pl.color} />
                      <circle cx="18.5" cy="18.5" r="2.8" fill={pl.color} />
                    </svg>
                  )}

                  {/* 5. Bluebell Variety: Drooping twilight bells */}
                  {pl.variety === 'bluebell' && (
                    <svg width="24" height={pl.height} viewBox="0 0 24 46" fill="none">
                      <path d="M15 11 Q18 26 12 46" stroke="#059669" strokeWidth="2.1" strokeLinecap="round" />
                      <ellipse cx="9" cy="13" rx="4" ry="5.5" fill={pl.color} transform="rotate(-18 9 13)" />
                      <ellipse cx="7" cy="21" rx="3.5" ry="5" fill={pl.color} transform="rotate(-22 7 21)" opacity="0.85" />
                    </svg>
                  )}

                  {/* 6. Lavender Variety: Slender fragrant purple spire */}
                  {pl.variety === 'lavender' && (
                    <svg width="22" height={pl.height} viewBox="0 0 22 46" fill="none">
                      <path d="M11 11 Q12 28 11 46" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
                      <ellipse cx="11" cy="5" rx="2.8" ry="3.8" fill={pl.color} />
                      <ellipse cx="8" cy="11" rx="2.8" ry="3.2" fill={pl.color} />
                      <ellipse cx="14" cy="11" rx="2.8" ry="3.2" fill={pl.color} />
                      <ellipse cx="8" cy="17" rx="2.8" ry="3.2" fill={pl.color} />
                      <ellipse cx="14" cy="17" rx="2.8" ry="3.2" fill={pl.color} />
                      <ellipse cx="11" cy="22" rx="2.8" ry="2.8" fill={pl.color} />
                    </svg>
                  )}

                  {/* 7. Marigold Variety: Warm fluffy blossom */}
                  {pl.variety === 'marigold' && (
                    <svg width="26" height={pl.height} viewBox="0 0 26 46" fill="none">
                      <path d="M13 16 Q14 31 13 46" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
                      <circle cx="13" cy="12" r="7" fill={pl.color} opacity="0.9" />
                      <circle cx="13" cy="12" r="5" fill="#fef08a" opacity="0.8" />
                      <circle cx="13" cy="12" r="2.8" fill="#d97706" />
                    </svg>
                  )}

                  {/* 8. Starlight Variety: Magical glowing cyan fairy blossom */}
                  {pl.variety === 'starlight' && (
                    <svg width="24" height={pl.height} viewBox="0 0 24 46" fill="none">
                      <path d="M12 13 Q13 30 12 46" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="12" cy="11" r="5.5" fill="#55DDF0" opacity="0.35" filter="blur(1.5px)" />
                      <circle cx="12" cy="11" r="3.2" fill="#55DDF0" />
                      <circle cx="12" cy="11" r="1.4" fill="#ffffff" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* ===================================================================
                THE 5 INTERACTIVE LIVING OBJECTS (Natural Hotspots in Scenery)
               =================================================================== */}

            {/* Hotspot 1: 🌸 Our Garden (The Blossom Bed - Lower Center) */}
            <div className="absolute bottom-[20%] left-[42%] -translate-x-1/2 z-30">
              <button
                type="button"
                onClick={() => setActivePanel('garden')}
                className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#101A32]/90 backdrop-blur-md border border-indigo-400/50 shadow-[0_0_16px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95 transition-all text-white text-xs font-bold"
              >
                <span className="text-sm">🌸</span>
                <span className="tracking-wide">Our Garden</span>
                <span className="w-2 h-2 rounded-full bg-[#55DDF0] animate-ping ml-0.5" />
              </button>
            </div>

            {/* Hotspot 2: 💧 Today's Question (The Glowing Magic Fountain - Left) */}
            <div className="absolute bottom-[36%] left-[16%] z-30">
              <button
                type="button"
                onClick={() => setActivePanel('question')}
                className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0E1A30]/90 backdrop-blur-md border border-[#55DDF0]/60 shadow-[0_0_20px_rgba(85,221,240,0.5)] hover:scale-105 active:scale-95 transition-all text-cyan-200 text-xs font-bold"
              >
                <span className="text-sm">💧</span>
                <span className="tracking-wide text-white">Today&apos;s Question</span>
              </button>
            </div>

            {/* Hotspot 3: ✨ This or That (Stepping Stones - Center Path) */}
            <div className="absolute bottom-[28%] left-[58%] z-30">
              <button
                type="button"
                onClick={() => setActivePanel('this_or_that')}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#142340]/90 backdrop-blur-md border border-purple-400/50 shadow-[0_0_16px_rgba(168,85,247,0.35)] hover:scale-105 active:scale-95 transition-all text-purple-200 text-xs font-bold"
              >
                <span className="text-sm">✨</span>
                <span className="tracking-wide text-white">This or That</span>
              </button>
            </div>

            {/* Hotspot 4: 🌷 Mood Flower (Beside Stone Steps) */}
            <div className="absolute bottom-[14%] right-[8%] z-30">
              <button
                type="button"
                onClick={() => setActivePanel('mood')}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#101A32]/90 backdrop-blur-md border border-pink-400/50 shadow-[0_0_16px_rgba(244,63,94,0.35)] hover:scale-105 active:scale-95 transition-all text-pink-200 text-xs font-bold"
              >
                <span className="text-sm">🌷</span>
                <span className="tracking-wide text-white">Mood Flower</span>
              </button>
            </div>

            {/* Hotspot 5: 💌 Little Surprise (Cozy Cottage Porch - Right) */}
            <div className="absolute top-[44%] right-[16%] z-30">
              <button
                type="button"
                onClick={() => setActivePanel('surprise')}
                className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1D172E]/90 backdrop-blur-md border border-[#FFD28A]/60 shadow-[0_0_20px_rgba(255,210,138,0.5)] hover:scale-105 active:scale-95 transition-all text-amber-200 text-xs font-bold"
              >
                <span className="text-sm">💌</span>
                <span className="tracking-wide text-white">Little Surprise</span>
              </button>
            </div>

            {/* ===================================================================
                TOP MINIMAL HUD (Exit Control & Title)
               =================================================================== */}
            <div className="absolute top-4 inset-x-4 flex items-center justify-between z-40">
              {/* Back / Exit Control */}
              <button
                type="button"
                onClick={() => {
                  setActivePanel('none');
                  setIsWorldMode(false);
                }}
                className="px-3.5 py-1.5 rounded-full bg-[#0A1020]/75 backdrop-blur-md border border-indigo-400/30 text-indigo-200 hover:text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                aria-label="Exit full-screen world"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                <span>Exit World</span>
              </button>

              {/* Title & Water Drops Status */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#101A32]/85 backdrop-blur-md border border-indigo-500/30 text-xs font-bold text-cyan-200 shadow-md">
                  Our Little World 🌙🌷
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#101A32]/85 backdrop-blur-md border border-indigo-500/30 text-xs font-bold text-pink-300 shadow-md flex items-center gap-1">
                  <span>💧</span> {garden?.waterCount ?? 5}
                </span>
              </div>
            </div>

            {/* Quick Feedback Toast Banner */}
            <AnimatePresence>
              {activeFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#172744]/95 backdrop-blur-lg border border-cyan-400/40 text-cyan-100 text-xs font-bold shadow-2xl flex items-center gap-2"
                >
                  <span>✨</span>
                  <span>{activeFeedback}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ===================================================================
                THEMED ACTIVITY BOTTOM-SHEETS (Opens when Hotspot Selected)
               =================================================================== */}
            <AnimatePresence>
              {activePanel !== 'none' && (
                <motion.div
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                  className="fixed inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto bg-[#101A32]/95 backdrop-blur-2xl border-t border-indigo-500/30 rounded-t-3xl p-6 text-white shadow-2xl z-50 safe-bottom"
                >
                  {/* Top Sheet Header & Close Button */}
                  <div className="flex items-center justify-between border-b border-indigo-800/40 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {activePanel === 'garden' && '🌸'}
                        {activePanel === 'question' && '💧'}
                        {activePanel === 'this_or_that' && '✨'}
                        {activePanel === 'mood' && '🌷'}
                        {activePanel === 'surprise' && '💌'}
                      </span>
                      <h3 className="text-base font-bold text-white tracking-wide">
                        {activePanel === 'garden' && 'Our Garden · Shared Growth'}
                        {activePanel === 'question' && "Today's Little Question 💗"}
                        {activePanel === 'this_or_that' && 'This or That · Our Choice'}
                        {activePanel === 'mood' && 'Mood Flower · How are you today?'}
                        {activePanel === 'surprise' && 'A Little Surprise for Us'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePanel('none')}
                      className="p-1.5 rounded-full bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 hover:text-white transition-colors"
                      aria-label="Close activity panel"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </div>

                  {/* 1. Our Garden Content */}
                  {activePanel === 'garden' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-[#172744] border border-indigo-700/40 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-cyan-300 font-bold uppercase tracking-wider">Growth Stage</p>
                          <p className="text-lg font-bold text-white flex items-center gap-1.5 mt-0.5">
                            <span>{growthStage.icon}</span> {growthStage.stage}
                          </p>
                          <p className="text-xs text-indigo-300 mt-0.5">{growthStage.label}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-cyan-300 font-bold uppercase tracking-wider">Times Nourished</p>
                          <p className="text-lg font-bold text-white mt-0.5">{garden?.waterCount ?? 5} 💧</p>
                        </div>
                      </div>

                      {/* Water Garden Button */}
                      <button
                        type="button"
                        onClick={handleWater}
                        disabled={isWatering || isPending}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 text-white font-bold text-sm shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isWatering ? (
                          <>
                            <span className="animate-spin">💧</span>
                            <span>Watering our flowers...</span>
                          </>
                        ) : (
                          <>
                            <span>💧</span>
                            <span>Water our garden with love</span>
                          </>
                        )}
                      </button>

                      {/* Partner Flower Status */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="p-3 bg-[#172744] rounded-xl border border-indigo-800/40 text-center">
                          <p className="text-[11px] text-pink-300 font-bold font-sans">Pakhi&apos;s Flower</p>
                          <p className="text-xs font-semibold text-white mt-1">
                            {garden?.pakhiMood || 'Blooming gently 🌸'}
                          </p>
                        </div>
                        <div className="p-3 bg-[#172744] rounded-xl border border-indigo-800/40 text-center">
                          <p className="text-[11px] text-cyan-300 font-bold font-sans">Vansh&apos;s Flower</p>
                          <p className="text-xs font-semibold text-white mt-1">
                            {garden?.vanshMood || 'Blooming gently 🌷'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Today's Little Question Content */}
                  {activePanel === 'question' && dailyQuestion && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-[#172744] border border-indigo-700/40 space-y-2">
                        {dailyQuestion.intro && (
                          <p className="text-xs text-cyan-300 italic font-cursive">&ldquo;{dailyQuestion.intro}&rdquo;</p>
                        )}
                        <h4 className="text-base font-bold text-white leading-snug">
                          {dailyQuestion.question}
                        </h4>
                      </div>

                      {/* Answer Options */}
                      <div className="space-y-2.5">
                        {dailyQuestion.options.map((opt, idx) => {
                          const isSelected = dailyQuestion.userAnswer === opt;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleAnswerDailyQuestion(opt)}
                              disabled={isPending}
                              className={`w-full p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] flex items-center justify-between ${
                                isSelected
                                  ? 'bg-gradient-to-r from-pink-600/80 to-indigo-600/80 border-pink-400 text-white shadow-lg'
                                  : 'bg-[#172744] hover:bg-[#1f345c] border-indigo-800/50 text-indigo-100'
                              }`}
                            >
                              <span className="text-xs font-bold">{opt}</span>
                              {isSelected && <span>✓</span>}
                            </button>
                          );
                        })}
                      </div>

                      {/* Status / Mutual Reveal */}
                      <div className="p-3 rounded-xl bg-[#0E1A30] border border-indigo-800/40 text-center text-xs">
                        {dailyQuestion.bothAnswered ? (
                          <div className="space-y-1.5">
                            <p className="font-bold text-cyan-300">Both answers are here! 💕</p>
                            <div className="text-[11px] text-indigo-200">
                              <span>You: &ldquo;{dailyQuestion.userAnswer}&rdquo;</span>
                              <br />
                              <span>Your person: &ldquo;{dailyQuestion.partnerAnswer}&rdquo;</span>
                            </div>
                          </div>
                        ) : dailyQuestion.userAnswer ? (
                          <p className="text-indigo-300">
                            Your answer is saved • Waiting for your person 🤍
                          </p>
                        ) : (
                          <p className="text-indigo-400">
                            Tap an option to record your thought for today ✨
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. This or That Content */}
                  {activePanel === 'this_or_that' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-[#172744] border border-indigo-700/40 text-center">
                        <p className="text-[11px] text-purple-300 font-bold uppercase tracking-wider">Playful Choice</p>
                        <h4 className="text-base font-bold text-white mt-1">
                          {currentPrompt.question}
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleSelectChoice(currentPrompt.optionA.value)}
                          disabled={isPending}
                          className={`p-4 rounded-2xl border text-center transition-all active:scale-[0.98] ${
                            garden?.vanshChoice === currentPrompt.optionA.value || garden?.pakhiChoice === currentPrompt.optionA.value
                              ? 'bg-purple-900/60 border-purple-400 text-white'
                              : 'bg-[#172744] hover:bg-[#1f345c] border-indigo-800/40 text-indigo-200'
                          }`}
                        >
                          <p className="text-xs font-bold">{currentPrompt.optionA.text}</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectChoice(currentPrompt.optionB.value)}
                          disabled={isPending}
                          className={`p-4 rounded-2xl border text-center transition-all active:scale-[0.98] ${
                            garden?.vanshChoice === currentPrompt.optionB.value || garden?.pakhiChoice === currentPrompt.optionB.value
                              ? 'bg-purple-900/60 border-purple-400 text-white'
                              : 'bg-[#172744] hover:bg-[#1f345c] border-indigo-800/40 text-indigo-200'
                          }`}
                        >
                          <p className="text-xs font-bold">{currentPrompt.optionB.text}</p>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleNextPrompt}
                        disabled={isPending}
                        className="w-full py-2.5 rounded-xl bg-[#172744] hover:bg-[#1f345c] border border-indigo-700/40 text-xs font-semibold text-indigo-200 transition-colors"
                      >
                        Next Question ↻
                      </button>
                    </div>
                  )}

                  {/* 4. Mood Flower Content */}
                  {activePanel === 'mood' && (
                    <div className="space-y-4">
                      <p className="text-xs text-indigo-200 text-center font-sans">
                        How is your little corner of the world feeling today?
                      </p>

                      <div className="grid grid-cols-2 gap-2.5">
                        {MOOD_OPTIONS.map((mood) => (
                          <button
                            key={mood.value}
                            type="button"
                            onClick={() => handleSelectMood(mood.label)}
                            disabled={isPending}
                            className="p-3 bg-[#172744] hover:bg-[#1f345c] border border-indigo-800/40 rounded-xl text-left transition-all active:scale-95 flex items-center gap-2"
                          >
                            <span className="text-lg">{mood.icon}</span>
                            <span className="text-xs font-semibold text-white">{mood.label}</span>
                          </button>
                        ))}
                      </div>

                      <div className="p-3 bg-[#0E1A30] rounded-xl border border-indigo-800/40 text-center text-xs text-indigo-300">
                        {garden?.pakhiMood && <p>🌸 Pakhi is feeling: <span className="text-white font-bold">{garden.pakhiMood}</span></p>}
                        {garden?.vanshMood && <p className="mt-1">🌷 Vansh is feeling: <span className="text-white font-bold">{garden.vanshMood}</span></p>}
                      </div>
                    </div>
                  )}

                  {/* 5. A Little Surprise Content */}
                  {activePanel === 'surprise' && (
                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1C172E] to-[#121D38] border border-amber-300/40 shadow-xl space-y-3 text-center">
                        <span className="text-3xl block">💌</span>
                        <h4 className="text-base font-bold text-amber-200 font-cursive">
                          {ROMANTIC_SURPRISES[surpriseIndex].title}
                        </h4>
                        <p className="text-xs text-indigo-100 leading-relaxed italic">
                          &ldquo;{ROMANTIC_SURPRISES[surpriseIndex].message}&rdquo;
                        </p>
                        <p className="text-[11px] text-amber-300/90 font-bold uppercase tracking-wider">
                          {ROMANTIC_SURPRISES[surpriseIndex].author}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSurpriseIndex((prev) => (prev + 1) % ROMANTIC_SURPRISES.length)
                        }
                        className="w-full py-3 rounded-2xl bg-[#172744] hover:bg-[#1f345c] border border-indigo-700/40 text-xs font-bold text-amber-200 transition-colors"
                      >
                        Open Another Letter ✉️
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
