"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function UploadZone({ bookId }: { bookId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("bookId", String(bookId));
    const res = await fetch("/api/upload", { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed.");
      return;
    }
    router.refresh();
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-lg border-2 border-dashed p-6 text-center text-sm transition"
        style={{
          borderColor: dragging ? "var(--accent)" : "color-mix(in srgb, var(--ink) 25%, transparent)",
          background: dragging ? "var(--bg-deep)" : "transparent",
          color: "var(--ink-soft)",
        }}
      >
        {busy ? "Uploading…" : "Drop an EPUB or PDF here, or click to choose a file"}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".epub,.pdf,application/epub+zip,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
      {error && (
        <p className="mt-2 text-sm" style={{ color: "#b3341f" }}>
          {error}
        </p>
      )}
    </div>
  );
}
