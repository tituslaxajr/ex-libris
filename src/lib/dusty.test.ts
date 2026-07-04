import { describe, it, expect } from "vitest";
import { rankDustyBooks, templateNudge } from "./dusty";
import type { Book } from "@/db/schema";

const makeBook = (overrides: Partial<Book>): Book =>
  ({
    id: 1,
    title: "Test Book",
    subtitle: null,
    sortTitle: null,
    isbn10: null,
    isbn13: null,
    publisher: null,
    publishedYear: null,
    pageCount: null,
    coverUrl: null,
    format: "physical",
    status: "unread",
    acquiredAt: null,
    acquisitionReason: null,
    addedAt: "2026-01-01T00:00:00.000Z",
    finishedAt: null,
    currentPage: null,
    currentCfi: null,
    progressPercent: 0,
    aiSummary: null,
    aiThemes: null,
    aiDifficulty: null,
    aiEnrichedAt: null,
    sourceUrl: null,
    notes: null,
    ...overrides,
  }) as Book;

describe("rankDustyBooks", () => {
  const now = new Date("2026-07-01T00:00:00Z");

  it("ranks unread books by time on shelf, dustiest first", () => {
    const books = [
      makeBook({ id: 1, addedAt: "2026-06-01T00:00:00Z" }),
      makeBook({ id: 2, addedAt: "2025-07-01T00:00:00Z" }),
      makeBook({ id: 3, status: "reading", addedAt: "2024-01-01T00:00:00Z" }),
    ];
    const ranked = rankDustyBooks(books, now);
    expect(ranked.map((d) => d.book.id)).toEqual([2, 1]);
    expect(ranked[0].daysOnShelf).toBe(365);
  });

  it("returns empty when nothing is unread", () => {
    expect(rankDustyBooks([makeBook({ status: "finished" })], now)).toEqual([]);
  });
});

describe("templateNudge", () => {
  it("mentions the acquisition reason when present", () => {
    const nudge = templateNudge({
      book: makeBook({ title: "Holiness", acquisitionReason: "My pastor recommended it." }),
      daysOnShelf: 400,
    });
    expect(nudge).toContain("Holiness");
    expect(nudge).toContain("My pastor recommended it.");
    expect(nudge).toContain("over a year");
  });
});
