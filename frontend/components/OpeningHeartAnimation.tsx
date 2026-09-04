'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

const MAX_DEFAULT_PLAYS = 3;

export default function OpeningHeartAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDrawingComplete, setIsDrawingComplete] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  const dismissAnimation = useCallback(() => {
    setIsFadingOut(true);
    setTimeout(() => {
      if (isMountedRef.current) {
        setIsVisible(false);
        setIsFadingOut(false);
      }
    }, 600);
  }, []);

  const shouldPlayOnLaunch = useCallback(() => {
    if (typeof window === 'undefined') return false;

    // Check if already shown in this browser session
    const sessionShown = sessionStorage.getItem('daybyday_heart_session_shown');
    if (sessionShown === 'true') {
      return false;
    }

    const mode = localStorage.getItem('daybyday_heart_intro_mode') || 'first_3';
    if (mode === 'never') {
      return false;
    }

    if (mode === 'always') {
      return true;
    }

    // Default: 'first_3'
    const countStr = localStorage.getItem('daybyday_heart_intro_count') || '0';
    const count = parseInt(countStr, 10);
    return count < MAX_DEFAULT_PLAYS;
  }, []);

  const startAnimation = useCallback((isReplay = false) => {
    setIsVisible(true);
    setIsFadingOut(false);
    setIsDrawingComplete(false);

    // Record session and increment play count if not replay
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('daybyday_heart_session_shown', 'true');
      if (!isReplay) {
        const count = parseInt(localStorage.getItem('daybyday_heart_intro_count') || '0', 10);
        localStorage.setItem('daybyday_heart_intro_count', (count + 1).toString());
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Check if animation should automatically run
    if (shouldPlayOnLaunch()) {
      startAnimation(false);
    }

    // Global event listener to trigger replay from Settings or dev tools
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
  }, [shouldPlayOnLaunch, startAnimation]);

  // Canvas drawing effect when isVisible becomes true
  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI scaling
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // Clear canvas to deep black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Heart parametric coordinates precomputation
    // Matches screenshot formula:
    // x = 16 * sin(t)^3
    // y = 13*cos(t) - 5*cos(2t) - 2*cos(3t) - cos(4t)
    const pointsPerLayer = 120;
    const scales = [11, 12, 13, 14, 15, 16];
    const totalPoints = scales.length * pointsPerLayer;

    // Center coordinates
    const cx = width / 2;
    // Offset slightly upward to make room for bottom text and heart balance
    const cy = height / 2 - 25;

    // Base unit multiplier to fit on screen responsively
    // Max width of raw heart equation is 2 * 16 = 32 units.
    // Target max pixel width = min(width * 0.85, 420)
    const targetHeartWidth = Math.min(width * 0.85, 420);
    const baseScale = targetHeartWidth / (32 * 16);

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
    const pointsPerFrame = 4; // ~180 frames = 3 seconds at 60fps

    ctx.font = 'bold 8.5px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff69b4';
    ctx.shadowBlur = 4;

    const render = () => {
      if (!isMountedRef.current) return;

      const endIndex = Math.min(currentIndex + pointsPerFrame, totalPoints);

      for (let i = currentIndex; i < endIndex; i++) {
        const pt = allPoints[i];
        ctx.fillStyle = '#ffb6c1';
        ctx.fillText(pt.text, pt.x, pt.y);
      }

      currentIndex = endIndex;

      if (currentIndex < totalPoints) {
        animationFrameRef.current = requestAnimationFrame(render);
      } else {
        // Complete!
        setIsDrawingComplete(true);

        // Auto dismiss after 2.2 seconds post-completion
        const autoDismissTimer = setTimeout(() => {
          if (isMountedRef.current) {
            dismissAnimation();
          }
        }, 2200);

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
      className={`fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-between transition-opacity duration-600 cursor-pointer select-none overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ touchAction: 'none' }}
      role="dialog"
      aria-label="Welcome Heart Animation"
    >
      {/* Top Header Bar with Skip Button */}
      <div className="w-full max-w-md flex items-center justify-between p-4 z-10">
        <span className="text-[11px] font-medium tracking-wider uppercase text-pink-300/70">
          DayByDay 💕
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dismissAnimation();
          }}
          className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-pink-200 text-xs font-semibold backdrop-blur-md border border-white/15 transition-all shadow-sm"
          aria-label="Skip heart animation"
        >
          Skip ✕
        </button>
      </div>

      {/* Main Drawing Canvas */}
      <div className="relative flex-1 w-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className={`w-full h-full block ${isDrawingComplete ? 'animate-heart-pulse' : ''}`}
        />

        {/* Center glowing text after completion */}
        {isDrawingComplete && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-fade-in-up">
            <span className="text-3xl text-pink-400 drop-shadow-[0_0_12px_rgba(255,105,180,0.8)] animate-pulse">
              💕
            </span>
          </div>
        )}
      </div>

      {/* Bottom Subtitle and Dismiss Prompt */}
      <div className="w-full max-w-md pb-8 text-center space-y-1 z-10 px-4">
        <p className="font-cursive text-2xl sm:text-3xl text-pink-300 drop-shadow-[0_0_8px_rgba(255,182,193,0.5)]">
          DayByDay
        </p>
        <p className="text-[11px] tracking-widest text-pink-200/60 uppercase font-sans">
          {isDrawingComplete ? 'Tap anywhere to enter ✨' : 'Drawing love note...'}
        </p>
      </div>
    </div>
  );
}
