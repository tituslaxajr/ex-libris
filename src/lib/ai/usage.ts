import { db, tables } from "@/db";

type Feature = "chat" | "enrich" | "classify" | "nudge" | "quiz" | "congrats" | "plan_nudge";

const CHAT_MODEL = () => process.env.AI_CHAT_MODEL ?? "claude-opus-4-8";
const TASK_MODEL = () => process.env.AI_TASK_MODEL ?? "claude-haiku-4-5-20251001";

/** Record token usage for one AI call. Best-effort — never throws into a route. */
export async function recordUsage(args: {
  feature: Feature;
  tier: "chat" | "task";
  tokensIn: number;
  tokensOut: number;
  model?: string;
}): Promise<void> {
  try {
    await db.insert(tables.aiUsage).values({
      feature: args.feature,
      tier: args.tier,
      model: args.model ?? (args.tier === "task" ? TASK_MODEL() : CHAT_MODEL()),
      tokensIn: args.tokensIn,
      tokensOut: args.tokensOut,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // usage tracking is non-critical
  }
}
