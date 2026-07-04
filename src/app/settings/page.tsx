import { db, tables } from "@/db";
import { sql } from "drizzle-orm";
import { aiEnabled, getProvider } from "@/lib/ai";
import { getLibraryProfile } from "@/lib/books";
import { costOf, totalCost, formatUsd } from "@/lib/ai/pricing";
import SettingsPanel from "@/components/settings/SettingsPanel";

export const dynamic = "force-dynamic";

const FEATURE_LABELS: Record<string, string> = {
  chat: "Companion chat",
  enrich: "Book enrichment",
  classify: "Library classification",
  nudge: "Dusty-shelf nudges",
  quiz: "Recall quizzes",
  congrats: "Finish celebrations",
  plan_nudge: "Reading-plan nudges",
};

export default async function SettingsPage() {
  const profile = await getLibraryProfile();
  const [{ n: bookCount }] = await db.select({ n: sql<number>`count(*)` }).from(tables.books);
  const usage = await db.select().from(tables.aiUsage);

  const grandTotal = totalCost(usage);
  const byFeature = new Map<string, { tokensIn: number; tokensOut: number; cost: number }>();
  for (const row of usage) {
    const agg = byFeature.get(row.feature) ?? { tokensIn: 0, tokensOut: 0, cost: 0 };
    agg.tokensIn += row.tokensIn;
    agg.tokensOut += row.tokensOut;
    agg.cost += costOf(row.model, row.tokensIn, row.tokensOut);
    byFeature.set(row.feature, agg);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">Settings</h1>
      <SettingsPanel
        aiEnabled={aiEnabled()}
        provider={getProvider().id}
        chatModel={process.env.AI_CHAT_MODEL ?? "claude-opus-4-8"}
        taskModel={process.env.AI_TASK_MODEL ?? "claude-haiku-4-5-20251001"}
        bookCount={bookCount}
        profileComputedAt={profile?.computedAt ?? null}
        themeKey={profile?.themeKey ?? "hearth"}
        dominantGenres={profile?.dominantGenres ?? []}
      />

      <section className="surface-card mt-6 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">AI usage</h2>
          <span className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
            {formatUsd(grandTotal)}
          </span>
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
          Estimated total spend across {usage.length} AI call{usage.length === 1 ? "" : "s"}, from
          current model pricing.
          {getProvider().id === "mock" && " (Running on the offline mock provider, so this reads $0.)"}
        </p>
        {byFeature.size > 0 && (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr style={{ color: "var(--ink-soft)" }}>
                <th className="pb-1 text-left font-medium">Feature</th>
                <th className="pb-1 text-right font-medium">Tokens</th>
                <th className="pb-1 text-right font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {[...byFeature.entries()].map(([feature, agg]) => (
                <tr key={feature} style={{ borderTop: "1px solid color-mix(in srgb, var(--ink) 10%, transparent)" }}>
                  <td className="py-1">{FEATURE_LABELS[feature] ?? feature}</td>
                  <td className="py-1 text-right">{(agg.tokensIn + agg.tokensOut).toLocaleString()}</td>
                  <td className="py-1 text-right">{formatUsd(agg.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="surface-card mt-6 p-5">
        <h2 className="font-semibold">Your data</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
          Download your entire library — catalogue, reading history, highlights, notes, and plans —
          as a portable JSON file. Your data is yours.
        </p>
        <a href="/api/export" download className="btn-accent mt-4 inline-block">
          Export my library
        </a>
      </section>
    </div>
  );
}
