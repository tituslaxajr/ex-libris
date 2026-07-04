"use client";

import { useEffect, useState } from "react";

// Day (Vellum) / night (Candlelight) toggle. Night forces data-theme="observatory";
// day restores the library's classifier-chosen theme (read from data-theme-base).
export default function ThemeToggle() {
  const [night, setNight] = useState(false);

  useEffect(() => {
    setNight(document.documentElement.getAttribute("data-theme") === "observatory");
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const base = root.getAttribute("data-theme-base") || "hearth";
    const next = !night;
    setNight(next);
    root.setAttribute("data-theme", next ? "observatory" : base);
    try {
      localStorage.setItem("exlibris-mode", next ? "night" : "day");
    } catch {
      // ignore storage errors
    }
  };

  return (
    <button
      onClick={toggle}
      className="ml-auto rounded-md px-2 py-1 text-sm"
      style={{ color: "var(--ink-soft)", border: "1px solid color-mix(in srgb, var(--ink) 18%, transparent)" }}
      aria-label={night ? "Switch to daytime (Vellum)" : "Switch to lamplight (Candlelight)"}
      title={night ? "Daytime — Vellum" : "Lamplight — Candlelight"}
    >
      {night ? "☾" : "☀"}
    </button>
  );
}
