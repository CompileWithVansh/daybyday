'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface PhotoAnimationProps {
  position: number; // 0 = far apart, 1 = together
}

export function PhotoAnimation({ position }: PhotoAnimationProps) {
  const isMeeting = position >= 1.0;
  
  // Distance decreases as position increases
  // At position 0: max gap (100% apart)
  // At position 1: they meet
  const gapPercent = Math.max(0, (1 - position) * 100);
  
  if (isMeeting) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="relative w-56 h-72 sm:w-64 sm:h-80 rounded-2xl overflow-hidden border-4 border-pink-400 shadow-xl bg-pink-50"
        >
          <Image
            src="/images/finaltimeline_end.png"
            alt="Together!"
            fill
            className="object-contain"
          />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-lg font-bold text-pink-600"
        >
          Together forever 💕
        </motion.p>
      </div>
    );
  }

  return (
    <motion.div
      className="relative w-full h-32 flex items-center countdown-track-container"
      animate={{ '--position': position } as any}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
    >
      {/* Path already completed - Left segment */}
      <div className="countdown-line-completed-left" />

      {/* Path already completed - Right segment */}
      <div className="countdown-line-completed-right" />

      {/* Remaining path (faint/dashed track in the gap) */}
      <div className="countdown-line-remaining flex items-center justify-center">
        <div className="w-full h-1 bg-pink-100 border-t border-dashed border-pink-300" />
      </div>

      {/* Target Pulsing Heart in the middle of the track */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-base z-20 pointer-events-none"
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        ❤️
      </motion.div>

      {/* Pakhi - Left */}
      <div className="countdown-photo-left z-10 flex flex-col items-center">
        <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden border-2 border-pink-300 shadow-lg bg-pink-50">
          <Image
            src="/images/timelineleft.png"
            alt="Pakhi"
            width={96}
            height={112}
            className="object-contain w-full h-full"
            priority
          />
        </div>
        <p className="text-center text-[10px] sm:text-xs text-pink-600 font-semibold mt-1">Pakhi</p>
      </div>

      {/* Vansh - Right */}
      <div className="countdown-photo-right z-10 flex flex-col items-center">
        <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden border-2 border-pink-400 shadow-lg bg-pink-50">
          <Image
            src="/images/timelineright.png"
            alt="Vansh"
            width={96}
            height={112}
            className="object-contain w-full h-full"
            priority
          />
        </div>
        <p className="text-center text-[10px] sm:text-xs text-pink-600 font-semibold mt-1">Vansh</p>
      </div>
    </motion.div>
  );
}
