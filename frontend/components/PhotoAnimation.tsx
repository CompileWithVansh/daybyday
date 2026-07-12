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
    <div className="relative flex items-center justify-between py-6 px-4">
      {/* Pakhi - Left */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        animate={{ x: position * 20 }}
        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      >
        <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden border-2 border-pink-300 shadow-lg bg-pink-50">
          <Image
            src="/images/timelineleft.png"
            alt="Pakhi"
            width={96}
            height={112}
            className="object-contain w-full h-full"
          />
        </div>
        <p className="text-center text-xs text-pink-600 font-medium mt-1">Pakhi</p>
      </motion.div>

      {/* Timeline line between them */}
      <div className="absolute inset-0 flex items-center px-16 sm:px-20">
        <div className="relative w-full h-1 bg-pink-100 rounded-full overflow-hidden">
          {/* Filled portion showing how close they are */}
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-full"
            animate={{ width: `${position * 100}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 20 }}
          />
          {/* Pulsing heart in the middle */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 text-sm"
            animate={{
              left: `${Math.min(90, position * 100)}%`,
              scale: [1, 1.2, 1],
            }}
            transition={{
              left: { type: 'spring', stiffness: 60 },
              scale: { repeat: Infinity, duration: 1.5 },
            }}
          >
            ❤️
          </motion.div>
        </div>
      </div>

      {/* Distance indicator removed - visual gap speaks for itself */}

      {/* Vansh - Right */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        animate={{ x: -(position * 20) }}
        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      >
        <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl overflow-hidden border-2 border-pink-400 shadow-lg bg-pink-50">
          <Image
            src="/images/timelineright.png"
            alt="Vansh"
            width={96}
            height={112}
            className="object-contain w-full h-full"
          />
        </div>
        <p className="text-center text-xs text-pink-600 font-medium mt-1">Vansh</p>
      </motion.div>
    </div>
  );
}
