"use client";

import { useEffect, useState } from "react";

export default function PlanNudge({ planId }: { planId: number }) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/ai/plan-nudge/${planId}`, { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.message && setMessage(d.message))
      .catch(() => null);
  }, [planId]);

  if (!message) return null;
  return (
    <div className="surface-card mb-6 p-4" style={{ borderLeft: "4px solid var(--accent)" }}>
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
        A little behind
      </p>
      <p className="mt-1 leading-relaxed">{message}</p>
    </div>
  );
}
