"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BookLite {
  id: number;
  status: string;
  currentPage: number | null;
  pageCount: number | null;
  progressPercent: number;
  acquisitionReason: string | null;
  aiEnrichedAt: string | null;
}

const STATUSES = [
  ["unread", "Unread"],
  ["reading", "Reading"],
  ["finished", "Finished"],
  ["reference", "Reference"],
  ["abandoned", "Set aside"],
] as const;

export default function BookActions({ book, aiEnabled }: { book: BookLite; aiEnabled: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState(book.status);
  const [page, setPage] = useState(book.currentPage ?? 0);
  const [reason, setReason] = useState(book.acquisitionReason ?? "");
  const [enriching, setEnriching] = useState(false);
  const [saving, setSaving] = useState(false);

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    await fetch(`/api/books/${book.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    router.refresh();
  };

  const changeStatus = async (next: string) => {
    setStatus(next);
    await patch({ status: next });
  };

  const saveProgress = async () => {
    const percent = book.pageCount ? Math.min(100, (page / book.pageCount) * 100) : undefined;
    await patch({ currentPage: page, ...(percent !== undefined ? { progressPercent: percent } : {}) });
  };

  const enrich = async () => {
    setEnriching(true);
    await fetch(`/api/ai/enrich/${book.id}`, { method: "POST" });
    setEnriching(false);
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-soft)" }}>
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(([value, label]) => (
            <button
              key={value}
              onClick={() => changeStatus(value)}
              className="rounded-full px-3 py-1 text-sm"
              style={
                status === value
                  ? { background: "var(--accent)", color: "var(--surface)" }
                  : { background: "var(--bg-deep)", color: "var(--ink-soft)" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {status === "reading" && (
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-soft)" }}>
            Progress {book.pageCount ? `(page ${page} of ${book.pageCount})` : `(page ${page})`}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={book.pageCount ?? 1000}
              value={page}
              onChange={(e) => setPage(Number(e.target.value))}
              className="w-full accent-current"
              style={{ color: "var(--accent)" }}
            />
            <button className="btn-quiet text-sm" onClick={saveProgress} disabled={saving}>
              Save
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-soft)" }}>
          Why did you get this book?
        </label>
        <div className="flex gap-2">
          <input
            className="input-field"
            value={reason}
            placeholder="The companion uses this to encourage you…"
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            className="btn-quiet text-sm"
            onClick={() => patch({ acquisitionReason: reason || null })}
            disabled={saving}
          >
            Save
          </button>
        </div>
      </div>

      {aiEnabled && (
        <button className="btn-accent w-full" onClick={enrich} disabled={enriching}>
          {enriching ? "Thinking about this book…" : book.aiEnrichedAt ? "Re-enrich with AI" : "✨ Enrich with AI"}
        </button>
      )}
    </div>
  );
}
