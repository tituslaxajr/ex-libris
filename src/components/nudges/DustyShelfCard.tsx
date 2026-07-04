"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

interface NudgeData {
  nudge: { id: number; message: string } | null;
  book?: { id: number; title: string };
  daysOnShelf?: number;
}

export default function DustyShelfCard() {
  const [data, setData] = useState<NudgeData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/ai/nudge")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => null);
  }, []);

  if (!data?.nudge || dismissed) return null;

  const dismiss = async () => {
    setDismissed(true);
    await fetch("/api/ai/nudge", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: data.nudge!.id }),
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="surface-card relative mb-8 p-5"
        style={{ borderLeft: "4px solid var(--accent)" }}
      >
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-3 top-2 text-lg opacity-50 hover:opacity-100"
        >
          ×
        </button>
        <p className="label-caps flex items-center gap-2">
          <span className="fleuron not-italic" aria-hidden="true" />
          From the dusty shelf
          {data.daysOnShelf ? ` · ${data.daysOnShelf} days waiting` : ""}
        </p>
        <p className="dropcap mt-2 leading-relaxed">{data.nudge.message}</p>
        {data.book && (
          <Link
            href={`/books/${data.book.id}`}
            className="mt-3 inline-block text-sm font-semibold underline"
            style={{ color: "var(--accent)" }}
          >
            Open “{data.book.title}” →
          </Link>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
