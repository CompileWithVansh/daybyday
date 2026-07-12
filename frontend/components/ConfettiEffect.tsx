'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  emoji: string;
  size: number;
}

const PARTICLE_COUNT = 24;
const EMOJIS = ['❤️', '💕', '💗', '💖', '💘', '🩷'];
const COLORS = ['bg-pink-400', 'bg-pink-500', 'bg-red-400', 'bg-red-500', 'bg-pink-300'];

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3,
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    size: 12 + Math.random() * 16,
  }));
}

export function ConfettiEffect() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(generateParticles());
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50" aria-hidden="true">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: '-5%',
            fontSize: `${particle.size}px`,
          }}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: '110vh',
            opacity: [1, 1, 0.8, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: 'easeIn',
          }}
        >
          {particle.emoji}
        </motion.div>
      ))}

      {/* Colored circle confetti */}
      {Array.from({ length: 12 }, (_, i) => (
        <motion.div
          key={`circle-${i}`}
          className={`absolute rounded-full ${COLORS[i % COLORS.length]}`}
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: '-3%',
            width: `${6 + Math.random() * 10}px`,
            height: `${6 + Math.random() * 10}px`,
          }}
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{
            y: '105vh',
            opacity: [1, 1, 0.5, 0],
            scale: [1, 1.2, 0.8],
            x: [0, (Math.random() - 0.5) * 100],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 1.5,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}
