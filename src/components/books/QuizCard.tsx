"use client";

import { useState } from "react";

interface Question {
  question: string;
  answer: string;
}

export default function QuizCard({ bookId }: { bookId: number }) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setBusy(true);
    setError(null);
    setRevealed(new Set());
    const res = await fetch(`/api/ai/quiz/${bookId}`, { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      setError("Could not generate a quiz right now.");
      return;
    }
    const data = await res.json();
    setQuestions(data.questions ?? []);
  };

  const reveal = (i: number) => setRevealed((prev) => new Set(prev).add(i));

  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
          Recall quiz
        </p>
        <button className="btn-quiet text-sm" onClick={generate} disabled={busy}>
          {busy ? "Thinking…" : questions ? "New questions" : "Quiz me"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm" style={{ color: "#b3341f" }}>
          {error}
        </p>
      )}
      {!questions && !error && (
        <p className="mt-2 text-sm" style={{ color: "var(--ink-soft)" }}>
          Test what you remember — questions drawn from your highlights and the book’s themes.
        </p>
      )}
      {questions && (
        <ol className="mt-3 space-y-4">
          {questions.map((q, i) => (
            <li key={i}>
              <p className="font-semibold">
                {i + 1}. {q.question}
              </p>
              {revealed.has(i) ? (
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                  {q.answer}
                </p>
              ) : (
                <button
                  className="mt-1 text-sm underline"
                  style={{ color: "var(--accent)" }}
                  onClick={() => reveal(i)}
                >
                  Reveal answer
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
