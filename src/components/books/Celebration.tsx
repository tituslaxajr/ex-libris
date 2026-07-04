"use client";

import { motion, AnimatePresence } from "motion/react";

// A lightweight confetti burst — no external dependency, just motion.
const COLORS = ["#a05c2c", "#7a2e1d", "#c9a075", "#4e7a3a", "#e0a836", "#7787b3"];
const PIECES = Array.from({ length: 40 }, (_, i) => i);

export default function Celebration({
  message,
  onClose,
}: {
  message: string | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "color-mix(in srgb, var(--ink) 45%, transparent)" }}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {PIECES.map((i) => {
              const left = (i * 37) % 100;
              const delay = (i % 10) * 0.04;
              const color = COLORS[i % COLORS.length];
              const drift = ((i % 7) - 3) * 20;
              return (
                <motion.span
                  key={i}
                  initial={{ y: -40, x: 0, opacity: 1, rotate: 0 }}
                  animate={{ y: "105vh", x: drift, opacity: [1, 1, 0.6], rotate: 540 }}
                  transition={{ duration: 2.4 + (i % 5) * 0.2, delay, ease: "easeIn" }}
                  className="absolute top-0 h-3 w-2 rounded-sm"
                  style={{ left: `${left}%`, background: color }}
                />
              );
            })}
          </div>
          <motion.div
            initial={{ scale: 0.85, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            className="surface-card relative z-10 mx-4 max-w-md p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-4xl">🎉</p>
            <h2 className="mt-3 text-2xl font-bold">Finished!</h2>
            <p className="mt-2 leading-relaxed">{message}</p>
            <button className="btn-accent mt-5" onClick={onClose}>
              Thank you
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
