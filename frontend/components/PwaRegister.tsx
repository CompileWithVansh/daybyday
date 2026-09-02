'use client';

import { useEffect, useState } from 'react';
import { usePwaInstall } from '@/lib/usePwaInstall';

export default function PwaRegister() {
  const {
    isInstallable,
    canPrompt,
    isStandalone,
    isIOS,
    isOnline,
    promptInstall,
    dismissBanner,
  } = usePwaInstall();

  const [showIosModal, setShowIosModal] = useState(false);
  const [offlineToast, setOfflineToast] = useState(false);

  // Register service worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('DayByDay Service Worker registered with scope:', reg.scope);

            // Handle service worker updates
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('New version of DayByDay available!');
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.error('Service Worker registration failed:', err);
          });
      });
    }
  }, []);

  // Monitor offline state
  useEffect(() => {
    if (!isOnline) {
      setOfflineToast(true);
    } else {
      const timer = setTimeout(() => setOfflineToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (isStandalone) {
    return (
      <>
        {!isOnline && (
          <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] bg-amber-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Working Offline
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] bg-rose-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m2.828 2.828a6 6 0 018.485 0m-8.485 5.657a6 6 0 018.485 0" />
          </svg>
          Offline Mode Enabled
        </div>
      )}

      {/* Floating PWA Install Prompt Banner */}
      {isInstallable && (
        <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-pink-200 shadow-[0_8px_30px_rgb(236,72,153,0.18)] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3">
            <img
              src="/icons/icon-192.png"
              alt="DayByDay App Icon"
              className="w-11 h-11 rounded-xl shadow-md object-cover flex-shrink-0 border border-pink-100"
            />
            <div>
              <h4 className="text-xs font-bold text-pink-900">Install DayByDay App</h4>
              <p className="text-[11px] text-pink-500">Fast home screen access & countdowns</p>
            </div>
          </div>


          <div className="flex items-center gap-1.5">
            {canPrompt ? (
              <button
                onClick={promptInstall}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow-sm hover:from-pink-600 hover:to-rose-600 active:scale-95 transition-all"
              >
                Install
              </button>
            ) : isIOS ? (
              <button
                onClick={() => setShowIosModal(true)}
                className="px-3 py-1.5 rounded-xl bg-pink-100 text-pink-700 text-xs font-bold hover:bg-pink-200 active:scale-95 transition-all"
              >
                How to Install
              </button>
            ) : null}

            <button
              onClick={dismissBanner}
              aria-label="Dismiss install prompt"
              className="p-1 rounded-lg text-pink-400 hover:text-pink-600 hover:bg-pink-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* iOS Installation Instruction Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-pink-900 flex items-center gap-2">
                <span>📱</span> Install on iPhone / iPad
              </h3>
              <button
                onClick={() => setShowIosModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-pink-700 leading-relaxed">
              Safari on iOS requires 2 quick steps to add DayByDay directly to your Home Screen:
            </p>

            <ol className="text-xs text-gray-700 space-y-3 font-medium bg-pink-50/70 p-3.5 rounded-2xl border border-pink-100">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-pink-500 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Tap the <strong className="text-pink-600">Share button</strong> (square with arrow pointing up) at the bottom of Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-pink-500 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Scroll down and tap <strong className="text-pink-600">Add to Home Screen</strong>.
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIosModal(false)}
              className="w-full py-2.5 rounded-xl bg-pink-500 text-white font-bold text-xs shadow-md hover:bg-pink-600 active:scale-95 transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
