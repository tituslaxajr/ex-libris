import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { eq, desc } from "drizzle-orm";
import { aiEnabled, getProvider } from "@/lib/ai";
import { companionSystemPrompt, QUIZ_SCHEMA, quizPrompt } from "@/lib/ai/prompts";
import { getBookWithMeta, getLibraryProfile } from "@/lib/books";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  if (!aiEnabled()) {
    return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
  }
  const { bookId } = await params;
  const book = await getBookWithMeta(Number(bookId));
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const highlightRows = await db
    .select()
    .from(tables.highlights)
    .where(eq(tables.highlights.bookId, book.id))
    .orderBy(desc(tables.highlights.createdAt));
  const highlights = highlightRows.map((h) => h.selectedText).slice(0, 20);

  const profile = await getLibraryProfile();
  const result = await getProvider().complete({
    system: companionSystemPrompt(profile),
    messages: [{ role: "user", content: quizPrompt(book, book.authors, highlights) }],
    jsonSchema: QUIZ_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 1024,
    tier: "task",
  });

  try {
    const quiz = JSON.parse(result.text);
    return NextResponse.json({ questions: quiz.questions ?? [] });
  } catch {
    return NextResponse.json({ error: "AI returned an unparseable response." }, { status: 502 });
  }
}
