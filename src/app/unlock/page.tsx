"use client";

import { useState } from "react";

export default function UnlockPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setBusy(false);
    if (res.ok) {
      window.location.href = "/";
    } else {
      setError("That passcode didn't work. Try again.");
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="surface-card w-full max-w-sm p-8 text-center">
        <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
          Ex Libris
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-soft)" }}>
          This library is locked. Enter your passcode to continue.
        </p>
        <input
          className="input-field mt-5"
          type="password"
          value={code}
          autoFocus
          placeholder="Passcode"
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button className="btn-accent mt-3 w-full" onClick={submit} disabled={busy || !code}>
          {busy ? "Unlocking…" : "Unlock"}
        </button>
        {error && (
          <p className="mt-3 text-sm" style={{ color: "#b3341f" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
