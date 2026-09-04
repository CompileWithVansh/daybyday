'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

export default function OpeningHeartAnimation() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDrawingComplete, setIsDrawingComplete] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
    }, 500);
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

    if (typeof window !== 'undefined' && !isReplay) {
      const count = parseInt(localStorage.getItem('daybyday_heart_intro_count') || '0', 10);
      localStorage.setItem('daybyday_heart_intro_count', (count + 1).toString());
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Check if animation should run on this launch
    if (!checkShouldPlay()) {
      setIsVisible(false);
    } else {
      startAnimation(false);
    }

    // Global event listener to trigger replay from Settings
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

    // High DPI scaling for crisp text
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // Deep black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Exactly TWO concentric circles / loops as requested:
    // Scale 15.5 for outer loop, 13.0 for inner loop
    const scales = [15.5, 13.0];
    const pointsPerLayer = 64; // 64 points per circle = 128 total words
    const totalPoints = scales.length * pointsPerLayer;

    // Center coordinates: "make it low" -> shifted lower down on the screen
    const cx = width / 2;
    const cy = height * 0.54; // comfortably low on the screen

    // Base unit multiplier to fit on screen
    const targetHeartWidth = Math.min(width * 0.82, 380);
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
    // Total 128 words takes ~4.8 seconds: leisurely, romantic, and very easy to read!
    const MS_PER_WORD = 38;
    lastDrawTimeRef.current = performance.now();

    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const render = (currentTime: number) => {
      if (!isMountedRef.current) return;

      const elapsed = currentTime - lastDrawTimeRef.current;

      if (elapsed >= MS_PER_WORD) {
        // Calculate how many words to advance
        const wordsToAdvance = Math.max(1, Math.floor(elapsed / MS_PER_WORD));
        lastDrawTimeRef.current = currentTime;

        const endIndex = Math.min(currentIndex + wordsToAdvance, totalPoints);

        for (let i = currentIndex; i < endIndex; i++) {
          const pt = allPoints[i];

          // Soft pink romantic glow
          ctx.shadowColor = 'rgba(255, 105, 180, 0.7)';
          ctx.shadowBlur = 5;
          ctx.fillStyle = '#ffb6c1';
          ctx.fillText(pt.text, pt.x, pt.y);
        }

        currentIndex = endIndex;
      }

      if (currentIndex < totalPoints) {
        animationFrameRef.current = requestAnimationFrame(render);
      } else {
        // Complete!
        setIsDrawingComplete(true);

        // Auto dismiss after 2.5 seconds post-completion
        const autoDismissTimer = setTimeout(() => {
          if (isMountedRef.current) {
            dismissAnimation();
          }
        }, 2500);

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

  return (
    <div
      onClick={dismissAnimation}
      className={`fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-between transition-opacity duration-500 cursor-pointer select-none overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ touchAction: 'none' }}
      role="dialog"
      aria-label="Welcome Heart Animation"
    >
      {/* Top Header Bar with Skip Button */}
      <div className="w-full max-w-md flex items-center justify-between p-4 z-10">
        <span className="text-xs font-medium tracking-wider uppercase text-pink-300/80 font-sans">
          DayByDay 💕
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dismissAnimation();
          }}
          className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-pink-200 text-xs font-semibold backdrop-blur-md border border-white/20 transition-all shadow-sm"
          aria-label="Skip heart animation"
        >
          Skip ✕
        </button>
      </div>

      {/* Main Drawing Canvas (placed lower in viewport) */}
      <div className="relative flex-1 w-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className={`w-full h-full block ${isDrawingComplete ? 'animate-heart-pulse' : ''}`}
        />

        {/* Center glowing heart emoji once completed */}
        {isDrawingComplete && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-fade-in-up" style={{ transform: 'translateY(40px)' }}>
            <span className="text-3xl text-pink-400 drop-shadow-[0_0_15px_rgba(255,105,180,0.9)] animate-pulse">
              💕
            </span>
          </div>
        )}
      </div>

      {/* Bottom Subtitle and Dismiss Prompt */}
      <div className="w-full max-w-md pb-8 text-center space-y-1.5 z-10 px-4">
        <p className="font-cursive text-3xl text-pink-300 drop-shadow-[0_0_10px_rgba(255,182,193,0.6)]">
          DayByDay
        </p>
        <p className="text-xs tracking-widest text-pink-200/70 uppercase font-sans">
          {isDrawingComplete ? 'Tap anywhere to enter ✨' : 'Drawing love note...'}
        </p>
      </div>
    </div>
  );
}
