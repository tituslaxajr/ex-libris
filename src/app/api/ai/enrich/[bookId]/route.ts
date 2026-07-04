import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { aiEnabled, getProvider } from "@/lib/ai";
import { companionSystemPrompt, ENRICH_SCHEMA, enrichPrompt } from "@/lib/ai/prompts";
import { getBookWithMeta, getLibraryProfile } from "@/lib/books";
import { recordUsage } from "@/lib/ai/usage";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  if (!aiEnabled()) {
    return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
  }
  const { bookId } = await params;
  const book = await getBookWithMeta(Number(bookId));
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const profile = await getLibraryProfile();
  const result = await getProvider().complete({
    system: companionSystemPrompt(profile),
    messages: [{ role: "user", content: enrichPrompt(book, book.authors) }],
    jsonSchema: ENRICH_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 1024,
    tier: "task",
  });
  await recordUsage({ feature: "enrich", tier: "task", tokensIn: result.tokensIn, tokensOut: result.tokensOut });

  let enrichment: { summary: string; themes: string[]; difficulty: "intro" | "intermediate" | "advanced" };
  try {
    enrichment = JSON.parse(result.text);
  } catch {
    return NextResponse.json({ error: "AI returned an unparseable response." }, { status: 502 });
  }

  const [updated] = await db
    .update(tables.books)
    .set({
      aiSummary: enrichment.summary,
      aiThemes: enrichment.themes,
      aiDifficulty: enrichment.difficulty,
      aiEnrichedAt: new Date().toISOString(),
    })
    .where(eq(tables.books.id, book.id))
    .returning();

  return NextResponse.json({ book: updated });
}
