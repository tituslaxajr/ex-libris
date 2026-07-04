import type { Book } from "@/db/schema";

export interface DustyBook {
  book: Book;
  daysOnShelf: number;
}

/**
 * The "dusty shelf": unread books ranked by how long they've sat since being
 * added. Returns the dustiest first.
 */
export function rankDustyBooks(books: Book[], now: Date = new Date()): DustyBook[] {
  return books
    .filter((b) => b.status === "unread")
    .map((book) => ({
      book,
      daysOnShelf: Math.max(0, Math.floor((now.getTime() - new Date(book.addedAt).getTime()) / 86400000)),
    }))
    .sort((a, b) => b.daysOnShelf - a.daysOnShelf);
}

/** Template fallback used when no AI provider is configured. */
export function templateNudge(d: DustyBook): string {
  const title = d.book.title;
  const reason = d.book.acquisitionReason;
  const time =
    d.daysOnShelf > 365
      ? "over a year"
      : d.daysOnShelf > 60
        ? `${Math.round(d.daysOnShelf / 30)} months`
        : `${d.daysOnShelf} days`;
  return reason
    ? `"${title}" has been on your shelf for ${time}. You picked it up because: ${reason} Maybe today is the day to read the first chapter.`
    : `"${title}" has been waiting on your shelf for ${time}. Even ten pages would be a beginning.`;
}
