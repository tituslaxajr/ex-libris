import { BookMetadata, normalizeGoogleBooksVolume } from "./normalize";

/* eslint-disable @typescript-eslint/no-explicit-any */

function apiKeyParam(): string {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  return key ? `&key=${key}` : "";
}

export async function lookupIsbnGoogleBooks(isbn: string): Promise<BookMetadata | null> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${apiKeyParam()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const volume = data.items?.[0];
  return volume ? normalizeGoogleBooksVolume(volume) : null;
}

export async function searchGoogleBooks(query: string): Promise<BookMetadata[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10${apiKeyParam()}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []).map((v: any) => normalizeGoogleBooksVolume(v));
}
