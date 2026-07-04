import { promises as fs } from "fs";
import path from "path";

// Storage adapter. Local disk in dev/self-host; a hosted blob store can be
// swapped in for production (Vercel Blob) behind this same interface. Kept
// deliberately small: save bytes under a key, read them back, delete.

export interface StorageAdapter {
  save(key: string, data: Buffer, contentType: string): Promise<void>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");

const localStorage: StorageAdapter = {
  async save(key, data) {
    const full = path.join(UPLOAD_DIR, key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
  },
  async read(key) {
    return fs.readFile(path.join(UPLOAD_DIR, key));
  },
  async delete(key) {
    await fs.rm(path.join(UPLOAD_DIR, key), { force: true });
  },
};

export function getStorage(): StorageAdapter {
  // Only the local adapter ships in Phase 2. The interface leaves room for a
  // blob adapter selected via an env flag later.
  return localStorage;
}

/** Deterministic, collision-resistant storage key for a book file. */
export function makeStorageKey(bookId: number, filename: string): string {
  const ext = path.extname(filename).toLowerCase() || ".bin";
  const stamp = `${bookId}-${Date.now()}`;
  return `books/${bookId}/${stamp}${ext}`;
}
