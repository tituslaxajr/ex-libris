import { createClient } from "@libsql/client";
import { db, tables } from "@/db";
import { eq, inArray } from "drizzle-orm";

export interface SearchDoc {
  bookId: number;
  title: string;
  authors: string;
  summary: string;
  themes: string;
  highlights: string;
}

export interface SearchResult {
  bookId: number;
  title: string;
  snippet: string;
}

/** Pure: flatten a book and its highlights into the row we index in FTS5. */
export function buildSearchContent(
  book: {
    id: number;
    title: string;
    subtitle: string | null;
    aiSummary: string | null;
    aiThemes: string[] | null;
  },
  authors: string[],
  highlights: string[]
): SearchDoc {
  return {
    bookId: book.id,
    title: [book.title, book.subtitle].filter(Boolean).join(" — "),
    authors: authors.join(", "),
    summary: book.aiSummary ?? "",
    themes: (book.aiThemes ?? []).join(", "),
    highlights: highlights.join("  ·  "),
  };
}

// FTS5 MATCH treats bareword punctuation as syntax; quote each term so free
// text like "grace & assurance" is searched literally.
function sanitizeQuery(raw: string): string {
  const terms = raw.match(/[\p{L}\p{N}]+/gu) ?? [];
  if (terms.length === 0) return "";
  return terms.map((t) => `"${t}"`).join(" OR ");
}

/**
 * Rebuild a small FTS5 index from current data and run the query. Rebuilding on
 * demand keeps the index perfectly consistent without cross-table triggers —
 * cheap at single-user scale (hundreds of books).
 */
export async function searchLibrary(query: string): Promise<SearchResult[]> {
  const match = sanitizeQuery(query);
  if (!match) return [];

  const books = await db.select().from(tables.books);
  if (books.length === 0) return [];
  const ids = books.map((b) => b.id);

  const authorRows = await db
    .select({ bookId: tables.bookAuthors.bookId, name: tables.authors.name })
    .from(tables.bookAuthors)
    .innerJoin(tables.authors, eq(tables.bookAuthors.authorId, tables.authors.id))
    .where(inArray(tables.bookAuthors.bookId, ids));
  const highlightRows = await db
    .select({ bookId: tables.highlights.bookId, text: tables.highlights.selectedText })
    .from(tables.highlights)
    .where(inArray(tables.highlights.bookId, ids));

  const authorsByBook = new Map<number, string[]>();
  for (const r of authorRows) {
    const list = authorsByBook.get(r.bookId) ?? [];
    list.push(r.name);
    authorsByBook.set(r.bookId, list);
  }
  const highlightsByBook = new Map<number, string[]>();
  for (const r of highlightRows) {
    const list = highlightsByBook.get(r.bookId) ?? [];
    list.push(r.text);
    highlightsByBook.set(r.bookId, list);
  }

  const docs = books.map((b) =>
    buildSearchContent(b, authorsByBook.get(b.id) ?? [], highlightsByBook.get(b.id) ?? [])
  );

  // Use a fresh in-memory database so the index never collides with app data.
  const client = createClient({ url: ":memory:" });
  await client.execute(
    "CREATE VIRTUAL TABLE lib USING fts5(bookId UNINDEXED, title, authors, summary, themes, highlights)"
  );
  for (const d of docs) {
    await client.execute({
      sql: "INSERT INTO lib(bookId, title, authors, summary, themes, highlights) VALUES (?, ?, ?, ?, ?, ?)",
      args: [d.bookId, d.title, d.authors, d.summary, d.themes, d.highlights],
    });
  }

  const res = await client.execute({
    sql: `SELECT bookId, title,
                 snippet(lib, -1, '[', ']', ' … ', 12) AS snip
          FROM lib
          WHERE lib MATCH ?
          ORDER BY bm25(lib, 10.0, 5.0, 2.0, 3.0, 1.0)
          LIMIT 25`,
    args: [match],
  });

  return res.rows.map((row) => ({
    bookId: Number(row.bookId),
    title: String(row.title),
    snippet: String(row.snip ?? ""),
  }));
}
