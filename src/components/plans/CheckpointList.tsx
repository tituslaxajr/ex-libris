"use client";

import { useState } from "react";

interface Checkpoint {
  id: number;
  label: string;
  dueDate: string | null;
  completedAt: string | null;
}

export default function CheckpointList({
  planId,
  checkpoints,
}: {
  planId: number;
  checkpoints: Checkpoint[];
}) {
  const [items, setItems] = useState(checkpoints);

  const toggle = async (cp: Checkpoint) => {
    const completed = !cp.completedAt;
    setItems((prev) =>
      prev.map((c) => (c.id === cp.id ? { ...c, completedAt: completed ? new Date().toISOString() : null } : c))
    );
    await fetch(`/api/plans/${planId}/checkpoints/${cp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    }).catch(() => null);
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <ul className="space-y-2">
      {items.map((cp) => {
        const overdue = !cp.completedAt && cp.dueDate && cp.dueDate < today;
        return (
          <li key={cp.id}>
            <button
              onClick={() => toggle(cp)}
              className="surface-card flex w-full items-center gap-3 p-3 text-left hover:opacity-90"
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs"
                style={{
                  borderColor: cp.completedAt ? "var(--accent)" : "color-mix(in srgb, var(--ink) 30%, transparent)",
                  background: cp.completedAt ? "var(--accent)" : "transparent",
                  color: "var(--surface)",
                }}
              >
                {cp.completedAt ? "✓" : ""}
              </span>
              <span className="flex-1" style={{ textDecoration: cp.completedAt ? "line-through" : "none" }}>
                {cp.label}
              </span>
              <span
                className="text-xs"
                style={{ color: overdue ? "#b3341f" : "var(--ink-soft)" }}
              >
                {cp.dueDate}
                {overdue ? " · overdue" : ""}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
