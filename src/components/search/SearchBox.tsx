"use client";

import { useState } from "react";
import Link from "next/link";

interface Result {
  bookId: number;
  title: string;
  snippet: string;
}

function renderSnippet(snippet: string) {
  // The FTS snippet marks matches with [ ]; render those bold.
  const parts = snippet.split(/(\[[^\]]*\])/g);
  return parts.map((part, i) =>
    part.startsWith("[") && part.endsWith("]") ? (
      <mark key={i} style={{ background: "var(--accent-soft)", color: "var(--ink)" }}>
        {part.slice(1, -1)}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    const q = query.trim();
    if (!q) return;
    setBusy(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    setBusy(false);
    const data = await res.json().catch(() => ({ results: [] }));
    setResults(data.results ?? []);
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          className="input-field"
          value={query}
          placeholder="grace, assurance, covenant, a phrase you highlighted…"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <button className="btn-accent" onClick={run} disabled={busy || !query.trim()}>
          {busy ? "Searching…" : "Search"}
        </button>
      </div>

      {results && (
        <div className="mt-6">
          {results.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
              Nothing matched. Try a different word, or enrich books and add highlights to search more.
            </p>
          ) : (
            <ul className="space-y-3">
              {results.map((r) => (
                <li key={r.bookId}>
                  <Link href={`/books/${r.bookId}`} className="surface-card block p-4 hover:opacity-95">
                    <p className="font-semibold">{r.title}</p>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                      {renderSnippet(r.snippet)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
