import { NextResponse } from "next/server";
import { db, tables } from "@/db";
import { eq, and } from "drizzle-orm";
import { aiEnabled, getProvider } from "@/lib/ai";
import { CLASSIFY_SCHEMA, classifyPrompt } from "@/lib/ai/prompts";
import { getBooksWithMeta } from "@/lib/books";
import { recordUsage } from "@/lib/ai/usage";
import type { LibraryTaxonomyEntry } from "@/db/schema";

interface Classification {
  dominantGenres: string[];
  taxonomy: LibraryTaxonomyEntry[];
  bookCategories: Array<{ bookId: number; category: string }>;
  personaPrompt: string;
  themeKey: string;
}

export async function POST() {
  if (!aiEnabled()) {
    return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
  }
  const books = await getBooksWithMeta();
  if (books.length === 0) {
    return NextResponse.json({ error: "No books to classify yet." }, { status: 400 });
  }

  const result = await getProvider().complete({
    system:
      "You are a librarian classifying a personal book collection. Respond with JSON matching the schema exactly.",
    messages: [
      {
        role: "user",
        content: classifyPrompt(
          books.map((b) => ({ id: b.id, title: b.title, authors: b.authors.join(", ") }))
        ),
      },
    ],
    jsonSchema: CLASSIFY_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 4096,
    tier: "task",
  });
  await recordUsage({ feature: "classify", tier: "task", tokensIn: result.tokensIn, tokensOut: result.tokensOut });

  let classification: Classification;
  try {
    classification = JSON.parse(result.text);
  } catch {
    return NextResponse.json({ error: "AI returned an unparseable response." }, { status: 502 });
  }

  const now = new Date().toISOString();
  await db
    .insert(tables.libraryProfile)
    .values({
      id: 1,
      dominantGenres: classification.dominantGenres,
      taxonomy: classification.taxonomy,
      personaPrompt: classification.personaPrompt,
      themeKey: classification.themeKey,
      computedAt: now,
      bookCountAtCompute: books.length,
    })
    .onConflictDoUpdate({
      target: tables.libraryProfile.id,
      set: {
        dominantGenres: classification.dominantGenres,
        taxonomy: classification.taxonomy,
        personaPrompt: classification.personaPrompt,
        themeKey: classification.themeKey,
        computedAt: now,
        bookCountAtCompute: books.length,
      },
    });

  // Upsert category tags and reassign books.
  for (const entry of classification.taxonomy) {
    const existing = await db
      .select()
      .from(tables.tags)
      .where(and(eq(tables.tags.name, entry.name), eq(tables.tags.kind, "category")));
    if (existing.length === 0) {
      await db.insert(tables.tags).values({ name: entry.name, kind: "category" });
    }
  }
  const categoryTags = await db.select().from(tables.tags).where(eq(tables.tags.kind, "category"));
  const tagIdByName = new Map(categoryTags.map((t) => [t.name, t.id]));

  for (const assignment of classification.bookCategories) {
    const tagId = tagIdByName.get(assignment.category);
    if (!tagId) continue;
    // Replace any previous category assignment for this book.
    for (const tag of categoryTags) {
      await db
        .delete(tables.bookTags)
        .where(and(eq(tables.bookTags.bookId, assignment.bookId), eq(tables.bookTags.tagId, tag.id)));
    }
    await db
      .insert(tables.bookTags)
      .values({ bookId: assignment.bookId, tagId, confidence: 1 })
      .onConflictDoNothing();
  }

  return NextResponse.json({ profile: classification });
}
