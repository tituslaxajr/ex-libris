export interface BookMetadata {
  title: string;
  subtitle?: string;
  authors: string[];
  isbn10?: string;
  isbn13?: string;
  publisher?: string;
  publishedYear?: number;
  pageCount?: number;
  coverUrl?: string;
  source: "openlibrary" | "googlebooks";
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export function normalizeOpenLibraryBook(
  data: any,
  authorNames: string[],
  isbn?: string
): BookMetadata {
  const isbn13 = data.isbn_13?.[0] ?? (isbn && isbn.length === 13 ? isbn : undefined);
  const isbn10 = data.isbn_10?.[0] ?? (isbn && isbn.length === 10 ? isbn : undefined);
  const year = data.publish_date ? parseYear(data.publish_date) : undefined;
  const coverId = data.covers?.[0];
  return {
    title: data.title ?? "Unknown title",
    subtitle: data.subtitle || undefined,
    authors: authorNames,
    isbn10,
    isbn13,
    publisher: data.publishers?.[0],
    publishedYear: year,
    pageCount: data.number_of_pages ?? undefined,
    coverUrl: coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : isbn13 || isbn10
        ? `https://covers.openlibrary.org/b/isbn/${isbn13 ?? isbn10}-L.jpg`
        : undefined,
    source: "openlibrary",
  };
}

export function normalizeOpenLibrarySearchDoc(doc: any): BookMetadata {
  return {
    title: doc.title ?? "Unknown title",
    subtitle: doc.subtitle || undefined,
    authors: doc.author_name ?? [],
    isbn13: doc.isbn?.find((i: string) => i.length === 13),
    isbn10: doc.isbn?.find((i: string) => i.length === 10),
    publisher: doc.publisher?.[0],
    publishedYear: doc.first_publish_year ?? undefined,
    pageCount: doc.number_of_pages_median ?? undefined,
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : undefined,
    source: "openlibrary",
  };
}

export function normalizeGoogleBooksVolume(volume: any): BookMetadata {
  const info = volume.volumeInfo ?? {};
  const identifiers: Array<{ type: string; identifier: string }> =
    info.industryIdentifiers ?? [];
  const isbn13 = identifiers.find((i) => i.type === "ISBN_13")?.identifier;
  const isbn10 = identifiers.find((i) => i.type === "ISBN_10")?.identifier;
  return {
    title: info.title ?? "Unknown title",
    subtitle: info.subtitle || undefined,
    authors: info.authors ?? [],
    isbn13,
    isbn10,
    publisher: info.publisher,
    publishedYear: info.publishedDate ? parseYear(info.publishedDate) : undefined,
    pageCount: info.pageCount ?? undefined,
    coverUrl: info.imageLinks?.thumbnail?.replace(/^http:/, "https:"),
    source: "googlebooks",
  };
}

export function parseYear(dateStr: string): number | undefined {
  const match = dateStr.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : undefined;
}

export function cleanIsbn(raw: string): string {
  return raw.replace(/[^0-9Xx]/g, "").toUpperCase();
}
