"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  aiEnabled: boolean;
  provider: string;
  chatModel: string;
  taskModel: string;
  bookCount: number;
  profileComputedAt: string | null;
  themeKey: string;
  dominantGenres: string[];
}

export default function SettingsPanel(props: Props) {
  const router = useRouter();
  const [classifying, setClassifying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reclassify = async () => {
    setClassifying(true);
    setMessage(null);
    const res = await fetch("/api/ai/classify-library", { method: "POST" });
    setClassifying(false);
    if (res.ok) {
      setMessage("Library re-classified — theme, shelves, and companion persona updated.");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ?? "Classification failed.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-5">
        <h2 className="font-semibold">AI companion</h2>
        <dl className="mt-3 grid grid-cols-[140px_1fr] gap-y-2 text-sm">
          <dt style={{ color: "var(--ink-soft)" }}>Status</dt>
          <dd>{props.aiEnabled ? `enabled (${props.provider})` : "not configured"}</dd>
          <dt style={{ color: "var(--ink-soft)" }}>Chat model</dt>
          <dd>{props.chatModel}</dd>
          <dt style={{ color: "var(--ink-soft)" }}>Task model</dt>
          <dd>{props.taskModel}</dd>
        </dl>
        {!props.aiEnabled && (
          <div className="mt-4 rounded-lg p-4 text-sm leading-relaxed" style={{ background: "var(--bg-deep)" }}>
            <p className="font-semibold">To enable the companion:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>
                Create an API key at <code>console.anthropic.com</code> (a $5 credit block lasts a long time —
                typical use is a few cents per conversation).
              </li>
              <li>
                Put it in your <code>.env</code> file: <code>ANTHROPIC_API_KEY=sk-ant-...</code>
              </li>
              <li>Restart the app. The key never leaves the server.</li>
            </ol>
          </div>
        )}
      </section>

      <section className="surface-card p-5">
        <h2 className="font-semibold">Library profile</h2>
        <dl className="mt-3 grid grid-cols-[140px_1fr] gap-y-2 text-sm">
          <dt style={{ color: "var(--ink-soft)" }}>Books</dt>
          <dd>{props.bookCount}</dd>
          <dt style={{ color: "var(--ink-soft)" }}>Theme</dt>
          <dd>{props.themeKey}</dd>
          <dt style={{ color: "var(--ink-soft)" }}>Dominant genres</dt>
          <dd>{props.dominantGenres.length ? props.dominantGenres.join(", ") : "not classified yet"}</dd>
          <dt style={{ color: "var(--ink-soft)" }}>Last classified</dt>
          <dd>{props.profileComputedAt ? new Date(props.profileComputedAt).toLocaleString() : "never"}</dd>
        </dl>
        <p className="mt-3 text-sm" style={{ color: "var(--ink-soft)" }}>
          Classification looks at your whole catalogue and adapts the app: shelf categories, visual
          theme, and the companion’s persona all follow the kinds of books you actually own.
        </p>
        <button className="btn-accent mt-4" onClick={reclassify} disabled={classifying || !props.aiEnabled}>
          {classifying ? "Reading your shelves…" : "Re-classify my library"}
        </button>
        {message && <p className="mt-3 text-sm">{message}</p>}
      </section>
    </div>
  );
}
