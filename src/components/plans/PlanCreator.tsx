"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BookOption {
  id: number;
  title: string;
  pageCount: number | null;
}

export default function PlanCreator({ books }: { books: BookOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bookId, setBookId] = useState<number | "">("");
  const [targetDate, setTargetDate] = useState("");
  const [count, setCount] = useState(6);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (!bookId || !targetDate) {
      setError("Pick a book and a target date.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, targetDate, checkpointCount: count }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not create the plan.");
      return;
    }
    const { plan } = await res.json();
    router.push(`/plans/${plan.id}`);
  };

  if (!open) {
    return (
      <button className="btn-accent" onClick={() => setOpen(true)}>
        + New reading plan
      </button>
    );
  }

  return (
    <div className="surface-card p-5">
      <h2 className="font-semibold">New reading plan</h2>
      <div className="mt-3 space-y-3">
        <div>
          <label className="mb-1 block text-sm" style={{ color: "var(--ink-soft)" }}>
            Book
          </label>
          <select className="input-field" value={bookId} onChange={(e) => setBookId(Number(e.target.value))}>
            <option value="">Choose a book…</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
                {b.pageCount ? ` (${b.pageCount} pp)` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--ink-soft)" }}>
              Finish by
            </label>
            <input
              className="input-field"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--ink-soft)" }}>
              Checkpoints
            </label>
            <input
              className="input-field"
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-accent" onClick={create} disabled={busy}>
            {busy ? "Creating…" : "Create plan"}
          </button>
          <button className="btn-quiet" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
        {error && (
          <p className="text-sm" style={{ color: "#b3341f" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
