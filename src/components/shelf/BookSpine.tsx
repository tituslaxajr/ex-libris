"use client";

import Link from "next/link";
import { motion } from "motion/react";

export interface SpineBook {
  id: number;
  title: string;
  authors: string[];
  status: string;
  pageCount: number | null;
  progressPercent: number;
}

// Deterministic spine color from the title, so shelves look varied but stable.
function spineHue(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

export default function BookSpine({ book }: { book: SpineBook }) {
  const hue = spineHue(book.title);
  const height = 150 + (Math.abs(spineHue(book.title + "h")) % 40); // 150-190px
  const width = Math.min(58, Math.max(26, Math.round((book.pageCount ?? 250) / 12)));
  const unread = book.status === "unread";

  return (
    <Link href={`/books/${book.id}`} className="group relative self-end" title={`${book.title} — ${book.authors.join(", ")}`}>
      <motion.div
        initial={false}
        whileHover={{ y: -14, rotate: -1.5 }}
        transition={{ type: "spring", stiffness: 350, damping: 22 }}
        className="relative flex items-end justify-center overflow-hidden rounded-t-sm rounded-b-[2px]"
        style={{
          width,
          height,
          background: `linear-gradient(90deg, hsl(${hue} 32% 30%) 0%, hsl(${hue} 38% 42%) 18%, hsl(${hue} 36% 38%) 82%, hsl(${hue} 30% 26%) 100%)`,
          boxShadow: "inset 0 0 6px rgba(0,0,0,0.35), 1px 2px 3px rgba(0,0,0,0.3)",
          filter: unread ? "saturate(0.55) brightness(0.92)" : undefined,
        }}
      >
        <span
          className="px-1 pb-2 text-center text-[10px] font-semibold leading-tight tracking-wide"
          style={{
            writingMode: "vertical-rl",
            color: `hsl(${hue} 45% 88%)`,
            maxHeight: height - 24,
            overflow: "hidden",
            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
          }}
        >
          {book.title.length > 34 ? book.title.slice(0, 32) + "…" : book.title}
        </span>
        {/* dust film on long-unread books */}
        {unread && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-2"
            style={{ background: "linear-gradient(rgba(215,210,190,0.55), transparent)" }}
          />
        )}
        {book.status === "reading" && (
          <div
            className="absolute bottom-0 left-0 h-1 w-full"
            style={{ background: "rgba(0,0,0,0.3)" }}
          >
            <div
              className="h-full"
              style={{ width: `${book.progressPercent}%`, background: "var(--accent)" }}
            />
          </div>
        )}
      </motion.div>
      <div
        className="pointer-events-none absolute -top-8 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-xs group-hover:block"
        style={{ background: "var(--ink)", color: "var(--bg)" }}
      >
        {book.title}
      </div>
    </Link>
  );
}
