import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { getStorage, makeStorageKey } from "@/lib/storage";

const MAX_BYTES = 60 * 1024 * 1024; // 60 MB — generous for EPUB/PDF

function detectKind(filename: string, mime: string): "epub" | "pdf" | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".epub") || mime === "application/epub+zip") return "epub";
  if (lower.endsWith(".pdf") || mime === "application/pdf") return "pdf";
  return null;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  const bookId = Number(form.get("bookId"));

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!bookId) {
    return NextResponse.json({ error: "A bookId is required." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 60 MB)." }, { status: 413 });
  }

  const kind = detectKind(file.name, file.type);
  if (!kind) {
    return NextResponse.json(
      { error: "Only EPUB and PDF files are supported." },
      { status: 415 }
    );
  }

  const [book] = await db.select().from(tables.books).where(eq(tables.books.id, bookId));
  if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = makeStorageKey(bookId, file.name);
  await getStorage().save(key, buffer, file.type);

  const [record] = await db
    .insert(tables.bookFiles)
    .values({
      bookId,
      kind,
      storageKey: key,
      sizeBytes: buffer.length,
      uploadedAt: new Date().toISOString(),
    })
    .returning();

  await db.update(tables.books).set({ format: kind }).where(eq(tables.books.id, bookId));

  return NextResponse.json({ file: record }, { status: 201 });
}
