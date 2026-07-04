import { BookMetadata, cleanIsbn } from "./normalize";
import { lookupIsbnOpenLibrary, searchOpenLibrary } from "./openlibrary";
import { lookupIsbnGoogleBooks, searchGoogleBooks } from "./googlebooks";

// Open Library first (no key, good covers), Google Books as fallback — niche
// publishers (Banner of Truth, RHB, ...) are often missing from one or the other.

export async function lookupIsbn(rawIsbn: string): Promise<BookMetadata | null> {
  const isbn = cleanIsbn(rawIsbn);
  if (isbn.length !== 10 && isbn.length !== 13) return null;
  try {
    const ol = await lookupIsbnOpenLibrary(isbn);
    if (ol) return ol;
  } catch {
    // fall through to Google
  }
  try {
    return await lookupIsbnGoogleBooks(isbn);
  } catch {
    return null;
  }
}

export async function searchBooks(query: string): Promise<BookMetadata[]> {
  try {
    const ol = await searchOpenLibrary(query);
    if (ol.length > 0) return ol;
  } catch {
    // fall through
  }
  try {
    return await searchGoogleBooks(query);
  } catch {
    return [];
  }
}

export type { BookMetadata } from "./normalize";
