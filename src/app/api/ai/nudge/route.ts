import { NextResponse } from "next/server";
import { db, tables } from "@/db";
import { eq, isNull, and } from "drizzle-orm";
import { aiEnabled, getProvider } from "@/lib/ai";
import { companionSystemPrompt, nudgePrompt } from "@/lib/ai/prompts";
import { getBooksWithMeta, getLibraryProfile } from "@/lib/books";
import { rankDustyBooks, templateNudge } from "@/lib/dusty";
import { recordUsage } from "@/lib/ai/usage";

// Returns (creating if needed) the current dusty-shelf nudge.
export async function GET() {
  const books = await getBooksWithMeta();
  const dusty = rankDustyBooks(books);
  if (dusty.length === 0) return NextResponse.json({ nudge: null });
  const top = dusty[0];

  const [existing] = await db
    .select()
    .from(tables.nudges)
    .where(
      and(
        eq(tables.nudges.kind, "dusty_shelf"),
        eq(tables.nudges.bookId, top.book.id),
        isNull(tables.nudges.dismissedAt)
      )
    );
  if (existing) {
    return NextResponse.json({ nudge: existing, book: top.book, daysOnShelf: top.daysOnShelf });
  }

  let message: string;
  if (aiEnabled()) {
    try {
      const profile = await getLibraryProfile();
      const book = books.find((b) => b.id === top.book.id);
      const result = await getProvider().complete({
        system: companionSystemPrompt(profile),
        messages: [
          { role: "user", content: nudgePrompt(top.book, book?.authors ?? [], top.daysOnShelf) },
        ],
        maxTokens: 512,
        tier: "task",
      });
      await recordUsage({ feature: "nudge", tier: "task", tokensIn: result.tokensIn, tokensOut: result.tokensOut });
      message = result.text.trim();
    } catch {
      message = templateNudge(top);
    }
  } else {
    message = templateNudge(top);
  }

  const [nudge] = await db
    .insert(tables.nudges)
    .values({
      kind: "dusty_shelf",
      bookId: top.book.id,
      message,
      createdAt: new Date().toISOString(),
    })
    .returning();

  return NextResponse.json({ nudge, book: top.book, daysOnShelf: top.daysOnShelf });
}

export async function PATCH(req: Request) {
  const { id } = await req.json();
  if (typeof id !== "number") return NextResponse.json({ error: "id required" }, { status: 400 });
  await db
    .update(tables.nudges)
    .set({ dismissedAt: new Date().toISOString() })
    .where(eq(tables.nudges.id, id));
  return NextResponse.json({ ok: true });
}
