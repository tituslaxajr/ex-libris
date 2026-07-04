import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { eq, asc } from "drizzle-orm";
import { aiEnabled, getProvider } from "@/lib/ai";
import { companionSystemPrompt, planNudgePrompt } from "@/lib/ai/prompts";
import { getBookWithMeta, getLibraryProfile } from "@/lib/books";
import { planStatus } from "@/lib/plans";
import { recordUsage } from "@/lib/ai/usage";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [plan] = await db
    .select()
    .from(tables.readingPlans)
    .where(eq(tables.readingPlans.id, Number(id)));
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const checkpoints = await db
    .select()
    .from(tables.planCheckpoints)
    .where(eq(tables.planCheckpoints.planId, plan.id))
    .orderBy(asc(tables.planCheckpoints.dueDate));
  const book = await getBookWithMeta(plan.bookId);
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  const status = planStatus(plan, checkpoints, book);
  if (status.onPace) return NextResponse.json({ message: null });

  const template = `You're about ${status.behindByDays} day${status.behindByDays === 1 ? "" : "s"} behind on “${book.title}”, with ${status.daysRemaining} days to go. No need to catch up all at once — just open it to your next checkpoint today and read a little. Small, steady progress still finishes the book.`;

  if (!aiEnabled()) return NextResponse.json({ message: template });

  try {
    const profile = await getLibraryProfile();
    const result = await getProvider().complete({
      system: companionSystemPrompt(profile),
      messages: [
        {
          role: "user",
          content: planNudgePrompt(book, book.authors, status.behindByDays, status.daysRemaining),
        },
      ],
      maxTokens: 400,
      tier: "task",
    });
    await recordUsage({ feature: "plan_nudge", tier: "task", tokensIn: result.tokensIn, tokensOut: result.tokensOut });
    return NextResponse.json({ message: result.text.trim() || template });
  } catch {
    return NextResponse.json({ message: template });
  }
}
