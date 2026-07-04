import { describe, it, expect } from "vitest";
import { costOf, totalCost, priceFor, formatUsd } from "./pricing";

describe("costOf", () => {
  it("prices Opus 4.8 input and output per million tokens", () => {
    // 1M in @ $5 + 1M out @ $25 = $30
    expect(costOf("claude-opus-4-8", 1_000_000, 1_000_000)).toBeCloseTo(30, 6);
  });

  it("prices Haiku cheaply", () => {
    // 200k in @ $1/M + 100k out @ $5/M = 0.0002*1000... = 0.2*1 + 0.1*5 = 0.7
    expect(costOf("claude-haiku-4-5", 200_000, 100_000)).toBeCloseTo(0.7, 6);
  });

  it("falls back to Opus-tier pricing for unknown models", () => {
    expect(priceFor("some-future-model")).toEqual({ input: 5, output: 25 });
    expect(costOf("some-future-model", 1_000_000, 0)).toBeCloseTo(5, 6);
  });

  it("is zero for zero tokens (mock provider case)", () => {
    expect(costOf("claude-opus-4-8", 0, 0)).toBe(0);
  });
});

describe("totalCost", () => {
  it("sums across rows of mixed models", () => {
    const rows = [
      { model: "claude-haiku-4-5", tokensIn: 1_000_000, tokensOut: 0 }, // $1
      { model: "claude-opus-4-8", tokensIn: 0, tokensOut: 1_000_000 }, // $25
    ];
    expect(totalCost(rows)).toBeCloseTo(26, 6);
  });
});

describe("formatUsd", () => {
  it("shows plain zero, sub-cent precision, and normal cents", () => {
    expect(formatUsd(0)).toBe("$0.00");
    expect(formatUsd(0.0032)).toBe("$0.0032");
    expect(formatUsd(3.5)).toBe("$3.50");
  });
});
