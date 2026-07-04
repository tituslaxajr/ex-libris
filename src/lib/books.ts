import { db, tables } from "@/db";
import { eq, inArray } from "drizzle-orm";
import type { Book, LibraryProfile } from "@/db/schema";

export interface BookWithMeta extends Book {
  authors: string[];
  category: string | null;
}

export async function getBooksWithMeta(): Promise<BookWithMeta[]> {
  const books = await db.select().from(tables.books);
  if (books.length === 0) return [];
  const ids = books.map((b) => b.id);

  const authorRows = await db
    .select({
      bookId: tables.bookAuthors.bookId,
      name: tables.authors.name,
    })
    .from(tables.bookAuthors)
    .innerJoin(tables.authors, eq(tables.bookAuthors.authorId, tables.authors.id))
    .where(inArray(tables.bookAuthors.bookId, ids));

  const tagRows = await db
    .select({
      bookId: tables.bookTags.bookId,
      name: tables.tags.name,
      kind: tables.tags.kind,
    })
    .from(tables.bookTags)
    .innerJoin(tables.tags, eq(tables.bookTags.tagId, tables.tags.id))
    .where(inArray(tables.bookTags.bookId, ids));

  const authorsByBook = new Map<number, string[]>();
  for (const row of authorRows) {
    const list = authorsByBook.get(row.bookId) ?? [];
    list.push(row.name);
    authorsByBook.set(row.bookId, list);
  }
  const categoryByBook = new Map<number, string>();
  for (const row of tagRows) {
    if (row.kind === "category" && !categoryByBook.has(row.bookId)) {
      categoryByBook.set(row.bookId, row.name);
    }
  }

  return books.map((b) => ({
    ...b,
    authors: authorsByBook.get(b.id) ?? [],
    category: categoryByBook.get(b.id) ?? null,
  }));
}

export async function getBookWithMeta(id: number): Promise<BookWithMeta | null> {
  const all = await getBooksWithMeta();
  return all.find((b) => b.id === id) ?? null;
}

export async function getBookFiles(bookId: number) {
  return db.select().from(tables.bookFiles).where(eq(tables.bookFiles.bookId, bookId));
}

export async function getLibraryProfile(): Promise<LibraryProfile | undefined> {
  const rows = await db.select().from(tables.libraryProfile).where(eq(tables.libraryProfile.id, 1));
  return rows[0];
}

/** Insert a book plus its authors, reusing existing author rows. */
export async function insertBookWithAuthors(
  book: typeof tables.books.$inferInsert,
  authorNames: string[]
): Promise<Book> {
  const [created] = await db.insert(tables.books).values(book).returning();
  for (const name of authorNames.filter((n) => n.trim())) {
    const [author] = await db
      .insert(tables.authors)
      .values({ name: name.trim() })
      .onConflictDoUpdate({ target: tables.authors.name, set: { name: name.trim() } })
      .returning();
    await db
      .insert(tables.bookAuthors)
      .values({ bookId: created.id, authorId: author.id })
      .onConflictDoNothing();
  }
  return created;
}
