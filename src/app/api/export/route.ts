import { NextResponse } from "next/server";
import { db, tables } from "@/db";

// Full portable JSON dump of the library. Uploaded file *bytes* are not
// included — only book_files metadata (storageKey) — so the user's own data
// (catalogue, notes, highlights, plans, reading history) is theirs to keep.
export async function GET() {
  const [
    books,
    authors,
    bookAuthors,
    tags,
    bookTags,
    bookFiles,
    readingSessions,
    readingPlans,
    planCheckpoints,
    highlights,
    conversations,
    messages,
    libraryProfile,
    nudges,
    aiUsage,
  ] = await Promise.all([
    db.select().from(tables.books),
    db.select().from(tables.authors),
    db.select().from(tables.bookAuthors),
    db.select().from(tables.tags),
    db.select().from(tables.bookTags),
    db.select().from(tables.bookFiles),
    db.select().from(tables.readingSessions),
    db.select().from(tables.readingPlans),
    db.select().from(tables.planCheckpoints),
    db.select().from(tables.highlights),
    db.select().from(tables.conversations),
    db.select().from(tables.messages),
    db.select().from(tables.libraryProfile),
    db.select().from(tables.nudges),
    db.select().from(tables.aiUsage),
  ]);

  const payload = {
    app: "ex-libris",
    version: 1,
    exportedAt: new Date().toISOString(),
    note: "File contents (EPUB/PDF bytes) are not included — only book_files metadata.",
    data: {
      books,
      authors,
      bookAuthors,
      tags,
      bookTags,
      bookFiles,
      readingSessions,
      readingPlans,
      planCheckpoints,
      highlights,
      conversations,
      messages,
      libraryProfile,
      nudges,
      aiUsage,
    },
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="ex-libris-export-${date}.json"`,
    },
  });
}
