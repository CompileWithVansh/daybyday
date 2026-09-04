'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

const LOVE_QUOTES = [
  { quote: 'You are my today and all of my tomorrows.', author: 'Leo Christopher' },
  { quote: 'Every moment with you is my favorite memory.', author: 'Forever' },
  { quote: 'In a sea of people, my eyes will always search for you.', author: 'Always' },
  { quote: 'Together is my favorite place to be.', author: 'With Love' },
  { quote: 'Distance means so little when someone means so much.', author: 'Us' },
];

export default function OpeningHeartAnimation() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDrawingComplete, setIsDrawingComplete] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastDrawTimeRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  const dismissAnimation = useCallback(() => {
    setIsFadingOut(true);
    setTimeout(() => {
      if (isMountedRef.current) {
        setIsVisible(false);
        setIsFadingOut(false);
      }
    }, 450);
  }, []);

  const checkShouldPlay = useCallback(() => {
    if (typeof window === 'undefined') return true;

    const mode = localStorage.getItem('daybyday_heart_intro_mode') || 'first_3';
    if (mode === 'never') {
      return false;
    }

    if (mode === 'always') {
      return true;
    }

    // 'first_3': allow first 3 plays
    const countStr = localStorage.getItem('daybyday_heart_intro_count') || '0';
    const count = parseInt(countStr, 10);
    return count < 3;
  }, []);

  const startAnimation = useCallback((isReplay = false) => {
    setIsVisible(true);
    setIsFadingOut(false);
    setIsDrawingComplete(false);
    setQuoteIndex(Math.floor(Math.random() * LOVE_QUOTES.length));

    if (typeof window !== 'undefined' && !isReplay) {
      const count = parseInt(localStorage.getItem('daybyday_heart_intro_count') || '0', 10);
      localStorage.setItem('daybyday_heart_intro_count', (count + 1).toString());
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (!checkShouldPlay()) {
      setIsVisible(false);
    } else {
      startAnimation(false);
    }

    const handleReplay = () => {
      startAnimation(true);
    };

    window.addEventListener('daybyday-replay-heart-anim', handleReplay);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('daybyday-replay-heart-anim', handleReplay);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [checkShouldPlay, startAnimation]);

  // Canvas drawing effect
  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Measure parent container for accurate centering
    const container = canvas.parentElement;
    const width = container ? container.clientWidth : window.innerWidth;
    const height = container ? container.clientHeight : Math.max(320, window.innerHeight * 0.55);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // Clean white canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Exactly TWO concentric circles / loops:
    // Scale 15.5 for outer loop, 13.0 for inner loop
    const scales = [15.5, 13.0];
    const pointsPerLayer = 64; // 64 points per circle = 128 total words
    const totalPoints = scales.length * pointsPerLayer;

    // Center coordinates: perfectly centered inside canvas container
    const cx = width / 2;
    const cy = height / 2 + 10;

    // Target width: adapt to viewport
    const targetHeartWidth = Math.min(width * 0.84, 370);
    const baseScale = targetHeartWidth / (32 * 15.5);

    const allPoints: Array<{ x: number; y: number; text: string }> = [];

    for (const scale of scales) {
      const currentScaleFactor = scale * baseScale;
      for (let i = 0; i < pointsPerLayer; i++) {
        const t = (i * 2 * Math.PI) / pointsPerLayer;
        const rawX = 16 * Math.pow(Math.sin(t), 3);
        const rawY =
          13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t);

        // In screen coordinates: y goes downwards, so invert y
        const px = cx + rawX * currentScaleFactor;
        const py = cy - rawY * currentScaleFactor;

        allPoints.push({ x: px, y: py, text: 'I love you' });
      }
    }

    let currentIndex = 0;
    // Pacing: Draw 1 word every ~38ms (~26 words per second)
    const MS_PER_WORD = 38;
    lastDrawTimeRef.current = performance.now();

    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const render = (currentTime: number) => {
      if (!isMountedRef.current) return;

      const elapsed = currentTime - lastDrawTimeRef.current;

      if (elapsed >= MS_PER_WORD) {
        const wordsToAdvance = Math.max(1, Math.floor(elapsed / MS_PER_WORD));
        lastDrawTimeRef.current = currentTime;

        const endIndex = Math.min(currentIndex + wordsToAdvance, totalPoints);

        for (let i = currentIndex; i < endIndex; i++) {
          const pt = allPoints[i];

          // Vibrant rose-red text with gentle pink blur for maximum readability on white
          ctx.shadowColor = 'rgba(225, 29, 72, 0.35)';
          ctx.shadowBlur = 4;
          ctx.fillStyle = '#e11d48';
          ctx.fillText(pt.text, pt.x, pt.y);
        }

        currentIndex = endIndex;
      }

      if (currentIndex < totalPoints) {
        animationFrameRef.current = requestAnimationFrame(render);
      } else {
        // Complete!
        setIsDrawingComplete(true);

        // Auto dismiss after 2.8 seconds post-completion
        const autoDismissTimer = setTimeout(() => {
          if (isMountedRef.current) {
            dismissAnimation();
          }
        }, 2800);

        return () => clearTimeout(autoDismissTimer);
      }
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible, dismissAnimation]);

  if (!isVisible) return null;

  const activeQuote = LOVE_QUOTES[quoteIndex] || LOVE_QUOTES[0];

  return (
    <div
      ref={containerRef}
      onClick={dismissAnimation}
      className={`fixed inset-0 z-[99999] bg-gradient-to-b from-rose-50/70 via-white to-pink-50/50 flex flex-col items-center justify-between transition-opacity duration-500 cursor-pointer select-none overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ touchAction: 'none' }}
      role="dialog"
      aria-label="Welcome Heart Animation"
    >
      {/* Top Header Bar with Skip Button */}
      <div className="w-full max-w-md flex items-center justify-between p-4 z-20">
        <span className="text-xs font-bold tracking-wider uppercase text-pink-600 font-sans flex items-center gap-1.5">
          <span>🌸</span> DayByDay 💕
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dismissAnimation();
          }}
          className="px-4 py-1.5 rounded-full bg-pink-50 hover:bg-pink-100 active:scale-95 text-pink-700 text-xs font-semibold border border-pink-200 transition-all shadow-sm flex items-center gap-1"
          aria-label="Skip heart animation"
        >
          Skip ✕
        </button>
      </div>

      {/* Upper Section: Welcome Back & Romantic Quote */}
      <div className="w-full max-w-md px-6 text-center space-y-1.5 z-10 pt-1 pb-1 animate-fade-in-up">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100/80 text-pink-700 text-[11px] font-semibold tracking-wide">
          <span>✨</span> Welcome Back
        </div>
        <h2 className="font-cursive text-2xl sm:text-3xl text-pink-800 leading-tight">
          Every beat of my heart is for you
        </h2>
        <p className="text-xs text-pink-600/90 italic max-w-xs mx-auto leading-relaxed">
          &ldquo;{activeQuote.quote}&rdquo;
        </p>
      </div>

      {/* Main Drawing Canvas (Centrally balanced in remaining space) */}
      <div className="relative flex-1 w-full max-w-md flex items-center justify-center min-h-[300px] overflow-hidden">
        <canvas
          ref={canvasRef}
          className={`block ${isDrawingComplete ? 'animate-heart-pulse' : ''}`}
        />

        {/* Center glowing heart emoji once completed */}
        {isDrawingComplete && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-fade-in-up">
            <span className="text-3xl drop-shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse">
              💕
            </span>
          </div>
        )}
      </div>

      {/* Bottom Subtitle and Dismiss Prompt */}
      <div className="w-full max-w-md pb-7 text-center space-y-1 z-10 px-4">
        <p className="font-cursive text-2xl text-pink-600 drop-shadow-sm">
          DayByDay 💕
        </p>
        <p className="text-[11px] tracking-widest text-pink-400 font-sans uppercase">
          {isDrawingComplete ? 'Tap anywhere to enter ✨' : 'Writing love note...'}
        </p>
      </div>
    </div>
  );
}
