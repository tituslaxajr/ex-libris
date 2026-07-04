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

// Deterministic per-book hue so shelves look varied but stable. The actual
// palette (muted cloth vs. dark gilt-leather) is applied per theme in CSS via
// the `.spine-paint` class, so the day/night toggle restyles spines for free.
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
    <Link
      href={`/books/${book.id}`}
      className="group relative self-end"
      title={`${book.title} — ${book.authors.join(", ")}`}
    >
      <motion.div
        initial={false}
        whileHover={{ y: -14, rotate: -1.5 }}
        transition={{ type: "spring", stiffness: 350, damping: 22 }}
        className="spine-paint relative flex items-end justify-center overflow-hidden rounded-t-sm rounded-b-[2px]"
        style={
          {
            width,
            height,
            "--h": hue,
            filter: unread ? "saturate(0.7) brightness(0.96)" : undefined,
          } as React.CSSProperties
        }
      >
        <span
          className="spine-title px-1 pb-2 text-center text-[10px] font-semibold leading-tight tracking-wide"
          style={{
            writingMode: "vertical-rl",
            maxHeight: height - 24,
            overflow: "hidden",
          }}
        >
          {book.title.length > 34 ? book.title.slice(0, 32) + "…" : book.title}
        </span>
        {/* dust film on long-unread books */}
        {unread && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-2"
            style={{ background: "linear-gradient(rgba(220,214,192,0.55), transparent)" }}
          />
        )}
        {book.status === "reading" && (
          <div className="absolute bottom-0 left-0 h-1 w-full" style={{ background: "rgba(0,0,0,0.3)" }}>
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
