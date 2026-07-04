"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ReactReader } from "react-reader";
import type { Rendition } from "epubjs";

interface Props {
  fileId: number;
  bookId: number;
  initialCfi: string | null;
  onChapterText?: (text: string) => void;
  onHighlightSaved?: () => void;
}

export default function EpubReader({
  fileId,
  bookId,
  initialCfi,
  onChapterText,
  onHighlightSaved,
}: Props) {
  const [location, setLocation] = useState<string | number>(initialCfi ?? 0);
  const [percent, setPercent] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const persistProgress = useCallback(
    (cfi: string, pct: number) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        fetch(`/api/books/${bookId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentCfi: cfi, progressPercent: pct }),
        }).catch(() => null);
      }, 800);
    },
    [bookId]
  );

  // Log a reading session when the reader unmounts or the tab is hidden.
  useEffect(() => {
    const logSession = () => {
      const minutes = Math.round((Date.now() - startTimeRef.current) / 60000);
      if (minutes < 1) return;
      startTimeRef.current = Date.now();
      const body = JSON.stringify({ minutes, endCfi: String(location) });
      // sendBeacon survives page unload; fall back to fetch on route change.
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `/api/books/${bookId}/sessions`,
          new Blob([body], { type: "application/json" })
        );
      } else {
        fetch(`/api/books/${bookId}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => null);
      }
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden") logSession();
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      logSession();
    };
  }, [bookId, location]);

  const handleLocation = (loc: string | number) => {
    setLocation(loc);
    const rendition = renditionRef.current;
    if (rendition && typeof loc === "string") {
      // epubjs types don't expose book on Rendition cleanly; access loosely.
      const book = (rendition as unknown as { book: { locations: { percentageFromCfi: (c: string) => number } } }).book;
      try {
        const pct = Math.round((book.locations.percentageFromCfi(loc) || 0) * 100);
        if (pct > 0) {
          setPercent(pct);
          persistProgress(loc, pct);
        }
      } catch {
        persistProgress(loc, percent);
      }
      // Capture visible chapter text for grounded chat.
      if (onChapterText) {
        try {
          const contents = (rendition as unknown as { getContents: () => Array<{ document: Document }> }).getContents();
          const text = contents
            .map((c) => c.document?.body?.innerText ?? "")
            .join("\n")
            .trim()
            .slice(0, 8000);
          if (text) onChapterText(text);
        } catch {
          // best-effort
        }
      }
    }
  };

  const getRendition = (rendition: Rendition) => {
    renditionRef.current = rendition;
    const book = (rendition as unknown as { book: { ready: Promise<void>; locations: { generate: (n: number) => Promise<unknown> } } }).book;
    book.ready.then(() => book.locations.generate(1600)).catch(() => null);

    rendition.on("selected", (cfiRange: string) => {
      try {
        const range = (rendition as unknown as { getRange: (c: string) => Range }).getRange(cfiRange);
        const text = range?.toString().trim();
        if (!text) return;
        fetch(`/api/books/${bookId}/highlights`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedText: text, cfiRange }),
        })
          .then(() => {
            rendition.annotations.add("highlight", cfiRange, {}, undefined, "hl", {
              fill: "var(--accent)",
              "fill-opacity": "0.3",
            });
            showToast("Highlight saved");
            onHighlightSaved?.();
          })
          .catch(() => showToast("Could not save highlight"));
      } catch {
        // ignore selection errors
      }
    });
  };

  return (
    <div className="relative h-full w-full">
      <div style={{ height: "100%" }}>
        <ReactReader
          url={`/api/files/${fileId}`}
          location={location}
          locationChanged={handleLocation}
          getRendition={getRendition}
          epubInitOptions={{ openAs: "epub" }}
        />
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-1 text-xs"
        style={{ background: "color-mix(in srgb, var(--bg) 90%, transparent)", color: "var(--ink-soft)" }}
      >
        <span>{percent}% · select text to highlight</span>
      </div>
      {toast && (
        <div
          className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full px-4 py-1.5 text-sm shadow"
          style={{ background: "var(--ink)", color: "var(--bg)" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
