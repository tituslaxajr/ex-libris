"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPanel({
  bookId,
  placeholder = "Ask about your library…",
}: {
  bookId?: number;
  placeholder?: string;
}) {
  const [aiStatus, setAiStatus] = useState<{ enabled: boolean } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<number | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then(setAiStatus)
      .catch(() => setAiStatus({ enabled: false }));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (aiStatus && !aiStatus.enabled) {
    return (
      <div className="surface-card p-6 text-center">
        <p className="font-semibold">The reading companion is asleep.</p>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-soft)" }}>
          Add your Anthropic API key to wake it up — cataloguing and tracking work fine without it.
        </p>
        <Link href="/settings" className="mt-3 inline-block text-sm underline" style={{ color: "var(--accent)" }}>
          How to set it up →
        </Link>
      </div>
    );
  }

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId, bookId }),
      });
      if (!res.ok || !res.body) throw new Error("Chat request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const raw of events) {
          const dataLine = raw.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;
          const payload = JSON.parse(dataLine.slice(6));
          if (raw.startsWith("event: meta") && payload.conversationId) {
            setConversationId(payload.conversationId);
          } else if (raw.startsWith("event: error")) {
            assistantText += `\n[${payload.error}]`;
          } else if (payload.text) {
            assistantText += payload.text;
          }
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: assistantText };
            return copy;
          });
        }
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "Something went wrong talking to the companion. Please try again.",
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="surface-card flex h-[520px] flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm italic" style={{ color: "var(--ink-soft)" }}>
            {bookId
              ? "Ask anything about this book — its argument, its author, how to read it well."
              : "Ask across your whole library — “what do my books say about covenant theology?”"}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className="max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-2 text-sm leading-relaxed"
              style={
                m.role === "user"
                  ? { background: "var(--accent)", color: "var(--surface)" }
                  : { background: "var(--bg-deep)", color: "var(--ink)" }
              }
            >
              {m.content || (busy && i === messages.length - 1 ? "…" : "")}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-3" style={{ borderColor: "color-mix(in srgb, var(--ink) 12%, transparent)" }}>
        <div className="flex gap-2">
          <input
            className="input-field"
            value={input}
            placeholder={placeholder}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={busy}
          />
          <button className="btn-accent" onClick={send} disabled={busy || !input.trim()}>
            Send
          </button>
        </div>
        <p className="mt-2 text-center text-[11px]" style={{ color: "var(--ink-soft)" }}>
          The companion can be wrong — check the book.
        </p>
      </div>
    </div>
  );
}
