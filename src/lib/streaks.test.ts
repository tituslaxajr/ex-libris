import { describe, it, expect } from "vitest";
import { currentStreak, longestStreak } from "./streaks";

const day = (iso: string) => ({ startedAt: iso });

describe("currentStreak", () => {
  const now = new Date("2026-07-03T12:00:00");

  it("is zero with no sessions", () => {
    expect(currentStreak([], now)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const sessions = [
      day("2026-07-01T08:00:00"),
      day("2026-07-02T21:00:00"),
      day("2026-07-03T07:00:00"),
    ];
    expect(currentStreak(sessions, now)).toBe(3);
  });

  it("keeps the streak alive if the last read was yesterday", () => {
    const sessions = [day("2026-07-01T08:00:00"), day("2026-07-02T08:00:00")];
    expect(currentStreak(sessions, now)).toBe(2);
  });

  it("breaks after a missed day", () => {
    const sessions = [day("2026-06-28T08:00:00"), day("2026-07-01T08:00:00")];
    expect(currentStreak(sessions, now)).toBe(0);
  });

  it("counts multiple sessions in one day once", () => {
    const sessions = [day("2026-07-03T08:00:00"), day("2026-07-03T20:00:00")];
    expect(currentStreak(sessions, now)).toBe(1);
  });
});

describe("longestStreak", () => {
  it("finds the longest historical run", () => {
    const sessions = [
      day("2026-01-01T08:00:00"),
      day("2026-01-02T08:00:00"),
      day("2026-01-03T08:00:00"),
      day("2026-02-10T08:00:00"),
      day("2026-02-11T08:00:00"),
    ];
    expect(longestStreak(sessions)).toBe(3);
  });

  it("is zero with no sessions", () => {
    expect(longestStreak([])).toBe(0);
  });
});
