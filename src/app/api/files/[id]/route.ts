import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { getStorage } from "@/lib/storage";

// Streams an uploaded book file to the in-app reader. `id` is the book_files row id.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [record] = await db
    .select()
    .from(tables.bookFiles)
    .where(eq(tables.bookFiles.id, Number(id)));
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let data: Buffer;
  try {
    data = await getStorage().read(record.storageKey);
  } catch {
    return NextResponse.json({ error: "File missing from storage" }, { status: 410 });
  }

  const contentType = record.kind === "pdf" ? "application/pdf" : "application/epub+zip";
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(data.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
