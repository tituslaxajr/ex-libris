"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Metadata {
  title: string;
  subtitle?: string;
  authors: string[];
  isbn10?: string;
  isbn13?: string;
  publisher?: string;
  publishedYear?: number;
  pageCount?: number;
  coverUrl?: string;
  source?: string;
}

type Mode = "isbn" | "search" | "manual";

const emptyForm: Metadata = { title: "", authors: [] };

export default function AddBookPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("isbn");
  const [isbn, setIsbn] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Metadata[]>([]);
  const [form, setForm] = useState<Metadata>(emptyForm);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("unread");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<"find" | "confirm">("find");

  const lookupIsbn = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/lookup/isbn/${encodeURIComponent(isbn)}`);
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Lookup failed — try search or manual entry.");
      return;
    }
    const { metadata } = await res.json();
    setForm(metadata);
    setStage("confirm");
  };

  const search = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/lookup/search?q=${encodeURIComponent(query)}`);
    setBusy(false);
    if (!res.ok) {
      setError("Search failed. Try again or add manually.");
      return;
    }
    const { results } = await res.json();
    setResults(results);
    if (results.length === 0) setError("No matches found — try different words or add manually.");
  };

  const save = async () => {
    if (!form.title.trim()) {
      setError("A title is required.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        subtitle: form.subtitle || undefined,
        authors: form.authors.filter(Boolean),
        isbn10: form.isbn10,
        isbn13: form.isbn13,
        publisher: form.publisher,
        publishedYear: form.publishedYear,
        pageCount: form.pageCount,
        coverUrl: form.coverUrl,
        status,
        acquisitionReason: reason || undefined,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not save the book.");
      return;
    }
    const { book } = await res.json();
    router.push(`/books/${book.id}`);
  };

  const tabStyle = (m: Mode) =>
    mode === m
      ? { background: "var(--accent)", color: "var(--surface)" }
      : { background: "var(--bg-deep)", color: "var(--ink-soft)" };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Add a book</h1>

      {stage === "find" && (
        <>
          <div className="mt-4 flex gap-2">
            <button className="rounded-full px-4 py-1.5 text-sm" style={tabStyle("isbn")} onClick={() => setMode("isbn")}>
              By ISBN
            </button>
            <button className="rounded-full px-4 py-1.5 text-sm" style={tabStyle("search")} onClick={() => setMode("search")}>
              Search title
            </button>
            <button
              className="rounded-full px-4 py-1.5 text-sm"
              style={tabStyle("manual")}
              onClick={() => {
                setMode("manual");
                setForm(emptyForm);
                setStage("confirm");
              }}
            >
              Manually
            </button>
          </div>

          {mode === "isbn" && (
            <div className="surface-card mt-4 p-5">
              <label className="mb-1 block text-sm" style={{ color: "var(--ink-soft)" }}>
                ISBN (10 or 13 digits — usually above the barcode)
              </label>
              <div className="flex gap-2">
                <input
                  className="input-field"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="e.g. 9780851510552"
                  onKeyDown={(e) => e.key === "Enter" && lookupIsbn()}
                />
                <button className="btn-accent" onClick={lookupIsbn} disabled={busy || !isbn.trim()}>
                  {busy ? "Looking…" : "Look up"}
                </button>
              </div>
            </div>
          )}

          {mode === "search" && (
            <div className="surface-card mt-4 p-5">
              <div className="flex gap-2">
                <input
                  className="input-field"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Title, author…"
                  onKeyDown={(e) => e.key === "Enter" && search()}
                />
                <button className="btn-accent" onClick={search} disabled={busy || !query.trim()}>
                  {busy ? "Searching…" : "Search"}
                </button>
              </div>
              <ul className="mt-4 space-y-2">
                {results.map((r, i) => (
                  <li key={i}>
                    <button
                      className="w-full rounded-lg border p-3 text-left hover:opacity-80"
                      style={{ borderColor: "color-mix(in srgb, var(--ink) 15%, transparent)" }}
                      onClick={() => {
                        setForm(r);
                        setStage("confirm");
                      }}
                    >
                      <span className="font-semibold">{r.title}</span>
                      {r.publishedYear ? ` (${r.publishedYear})` : ""}
                      <span className="block text-sm" style={{ color: "var(--ink-soft)" }}>
                        {r.authors.join(", ")}
                        {r.publisher ? ` · ${r.publisher}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {stage === "confirm" && (
        <div className="surface-card mt-4 space-y-4 p-5">
          <div className="flex items-start gap-4">
            {form.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.coverUrl} alt="Cover" className="h-32 rounded shadow" />
            )}
            <div className="flex-1 space-y-3">
              <div>
                <label className="mb-1 block text-sm" style={{ color: "var(--ink-soft)" }}>Title *</label>
                <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm" style={{ color: "var(--ink-soft)" }}>Author(s), comma-separated</label>
                <input
                  className="input-field"
                  value={form.authors.join(", ")}
                  onChange={(e) => setForm({ ...form, authors: e.target.value.split(",").map((a) => a.trim()) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm" style={{ color: "var(--ink-soft)" }}>Publisher</label>
                  <input className="input-field" value={form.publisher ?? ""} onChange={(e) => setForm({ ...form, publisher: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm" style={{ color: "var(--ink-soft)" }}>Pages</label>
                  <input
                    className="input-field"
                    type="number"
                    value={form.pageCount ?? ""}
                    onChange={(e) => setForm({ ...form, pageCount: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--ink-soft)" }}>Have you read it?</label>
            <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="unread">Not yet — it goes on the waiting shelf</option>
              <option value="reading">I&apos;m reading it now</option>
              <option value="finished">I&apos;ve finished it</option>
              <option value="reference">It&apos;s a reference book</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--ink-soft)" }}>
              Why did you get it? <span className="italic">(the companion uses this to encourage you)</span>
            </label>
            <input
              className="input-field"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="A friend recommended it… I heard it helped…"
            />
          </div>

          <div className="flex gap-2">
            <button className="btn-accent flex-1" onClick={save} disabled={busy}>
              {busy ? "Adding…" : "Add to my library"}
            </button>
            <button className="btn-quiet" onClick={() => setStage("find")}>
              Back
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm" style={{ color: "#b3341f" }}>
          {error}
        </p>
      )}
    </div>
  );
}
