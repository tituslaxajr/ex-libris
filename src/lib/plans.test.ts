import { describe, it, expect } from "vitest";
import { generateCheckpoints, planStatus } from "./plans";

describe("generateCheckpoints", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("splits a paged book into contiguous page ranges", () => {
    const cps = generateCheckpoints({ pageCount: 300 }, "2026-04-01", 3, now);
    expect(cps).toHaveLength(3);
    expect(cps[0].label).toBe("Pages 1–100");
    expect(cps[1].label).toBe("Pages 101–200");
    expect(cps[2].label).toBe("Pages 201–300");
    expect(cps[2].targetPercent).toBe(100);
    // due dates increase
    expect(cps[0].dueDate < cps[1].dueDate).toBe(true);
    expect(cps[1].dueDate < cps[2].dueDate).toBe(true);
  });

  it("falls back to percentage milestones when pageCount is unknown", () => {
    const cps = generateCheckpoints({ pageCount: null }, "2026-02-01", 4, now);
    expect(cps).toHaveLength(4);
    expect(cps[0].label).toBe("Read to 25%");
    expect(cps[3].label).toBe("Read to 100%");
  });

  it("clamps checkpoint count to a sane range", () => {
    expect(generateCheckpoints({ pageCount: 100 }, "2026-02-01", 0, now)).toHaveLength(1);
    expect(generateCheckpoints({ pageCount: 100 }, "2026-02-01", 999, now)).toHaveLength(50);
  });
});

describe("planStatus", () => {
  it("reports on pace when progress keeps up with elapsed time", () => {
    // 90-day plan, ~50 days elapsed => expected ~55%, actual 60% => on pace
    const status = planStatus(
      { createdAt: "2026-01-01T00:00:00Z", targetDate: "2026-04-01", status: "active" },
      [],
      { progressPercent: 60 },
      new Date("2026-02-20T00:00:00Z")
    );
    expect(status.actualPercent).toBe(60);
    expect(status.onPace).toBe(true);
    expect(status.behindByDays).toBe(0);
  });

  it("detects being behind and estimates days behind", () => {
    // 90-day plan, ~45 days elapsed => expected ~50%, actual 10% => behind
    const status = planStatus(
      { createdAt: "2026-01-01T00:00:00Z", targetDate: "2026-04-01", status: "active" },
      [{ dueDate: "2026-01-15", completedAt: null }],
      { progressPercent: 10 },
      new Date("2026-02-15T00:00:00Z")
    );
    expect(status.onPace).toBe(false);
    expect(status.behindByDays).toBeGreaterThan(0);
    expect(status.expectedPercent).toBeGreaterThan(status.actualPercent);
  });

  it("returns the earliest incomplete checkpoint as nextDue", () => {
    const status = planStatus(
      { createdAt: "2026-01-01T00:00:00Z", targetDate: "2026-04-01", status: "active" },
      [
        { dueDate: "2026-03-01", completedAt: "2026-02-28T00:00:00Z" },
        { dueDate: "2026-02-01", completedAt: null },
        { dueDate: "2026-03-15", completedAt: null },
      ],
      { progressPercent: 30 },
      new Date("2026-01-20T00:00:00Z")
    );
    expect(status.nextDue).toBe("2026-02-01");
  });
});
