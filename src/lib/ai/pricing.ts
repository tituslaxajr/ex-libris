// Per-million-token pricing (USD), used to show a running spend estimate.
// Update alongside model changes. Unknown models fall back to Opus-tier so
// estimates never silently read as free.
export interface ModelPrice {
  input: number;
  output: number;
}

export const PRICING: Record<string, ModelPrice> = {
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-opus-4-7": { input: 5, output: 25 },
  "claude-sonnet-5": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
  "claude-fable-5": { input: 10, output: 50 },
};

const FALLBACK: ModelPrice = { input: 5, output: 25 };

export function priceFor(model: string): ModelPrice {
  return PRICING[model] ?? FALLBACK;
}

/** Cost in USD for a single call. */
export function costOf(model: string, tokensIn: number, tokensOut: number): number {
  const p = priceFor(model);
  return (tokensIn / 1_000_000) * p.input + (tokensOut / 1_000_000) * p.output;
}

export interface UsageRow {
  model: string;
  tokensIn: number;
  tokensOut: number;
}

export function totalCost(rows: UsageRow[]): number {
  return rows.reduce((sum, r) => sum + costOf(r.model, r.tokensIn, r.tokensOut), 0);
}

/** Format a USD amount, showing sub-cent precision for tiny totals. */
export function formatUsd(amount: number): string {
  if (amount === 0) return "$0.00";
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(2)}`;
}
