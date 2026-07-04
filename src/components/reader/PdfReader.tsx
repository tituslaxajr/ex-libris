"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Pin the worker to the installed pdfjs-dist version (bundled by webpack).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface Props {
  fileId: number;
  bookId: number;
  initialPage: number | null;
}

export default function PdfReader({ fileId, bookId, initialPage }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(initialPage && initialPage > 0 ? initialPage : 1);
  const [width, setWidth] = useState(700);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const startPageRef = useRef<number>(page);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setWidth(Math.min(820, containerRef.current.clientWidth - 24));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const persist = useCallback(
    (p: number, total: number) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const percent = total ? Math.round((p / total) * 100) : 0;
        fetch(`/api/books/${bookId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPage: p, progressPercent: percent }),
        }).catch(() => null);
      }, 600);
    },
    [bookId]
  );

  useEffect(() => {
    const logSession = () => {
      const minutes = Math.round((Date.now() - startTimeRef.current) / 60000);
      const pagesRead = Math.max(0, page - startPageRef.current);
      if (minutes < 1 && pagesRead < 1) return;
      startTimeRef.current = Date.now();
      startPageRef.current = page;
      const body = JSON.stringify({ minutes, pagesRead });
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
    return () => logSession();
  }, [bookId, page]);

  const go = (next: number) => {
    const clamped = Math.max(1, Math.min(numPages || 1, next));
    setPage(clamped);
    persist(clamped, numPages);
  };

  return (
    <div ref={containerRef} className="flex h-full flex-col items-center">
      <div
        className="flex w-full items-center justify-between px-4 py-2 text-sm"
        style={{ borderBottom: "1px solid color-mix(in srgb, var(--ink) 12%, transparent)" }}
      >
        <button className="btn-quiet" onClick={() => go(page - 1)} disabled={page <= 1}>
          ← Prev
        </button>
        <span style={{ color: "var(--ink-soft)" }}>
          Page {page}
          {numPages ? ` of ${numPages}` : ""}
        </span>
        <button className="btn-quiet" onClick={() => go(page + 1)} disabled={page >= numPages}>
          Next →
        </button>
      </div>
      <div className="flex-1 overflow-auto py-4">
        {error ? (
          <p className="p-6 text-center text-sm" style={{ color: "#b3341f" }}>
            {error}
          </p>
        ) : (
          <Document
            file={`/api/files/${fileId}`}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={() => setError("Could not open this PDF.")}
            loading={<p className="p-6 text-center text-sm">Opening…</p>}
          >
            <Page pageNumber={page} width={width} renderAnnotationLayer renderTextLayer />
          </Document>
        )}
      </div>
    </div>
  );
}
