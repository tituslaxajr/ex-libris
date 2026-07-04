import { BookMetadata, normalizeOpenLibraryBook, normalizeOpenLibrarySearchDoc } from "./normalize";

const HEADERS = {
  "User-Agent": "ExLibris/0.1 (personal library app)",
};

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function lookupIsbnOpenLibrary(isbn: string): Promise<BookMetadata | null> {
  const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`, {
    headers: HEADERS,
    redirect: "follow",
  });
  if (!res.ok) return null;
  const data = await res.json();

  const authorNames: string[] = [];
  for (const ref of (data.authors ?? []).slice(0, 5)) {
    try {
      const authorRes = await fetch(`https://openlibrary.org${ref.key}.json`, { headers: HEADERS });
      if (authorRes.ok) {
        const author = await authorRes.json();
        if (author.name) authorNames.push(author.name);
      }
    } catch {
      // author fetch is best-effort
    }
  }
  return normalizeOpenLibraryBook(data, authorNames, isbn);
}

export async function searchOpenLibrary(query: string): Promise<BookMetadata[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&fields=title,subtitle,author_name,isbn,publisher,first_publish_year,number_of_pages_median,cover_i`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.docs ?? []).map((doc: any) => normalizeOpenLibrarySearchDoc(doc));
}
