import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBooksWithMeta, insertBookWithAuthors } from "@/lib/books";

const createBookSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  authors: z.array(z.string()).default([]),
  isbn10: z.string().optional(),
  isbn13: z.string().optional(),
  publisher: z.string().optional(),
  publishedYear: z.number().int().optional(),
  pageCount: z.number().int().positive().optional(),
  coverUrl: z.string().url().optional(),
  format: z.enum(["physical", "epub", "pdf"]).default("physical"),
  status: z.enum(["unread", "reading", "finished", "abandoned", "reference"]).default("unread"),
  acquisitionReason: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const books = await getBooksWithMeta();
  return NextResponse.json({ books });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { authors, ...bookFields } = parsed.data;
  const book = await insertBookWithAuthors(
    { ...bookFields, addedAt: new Date().toISOString() },
    authors
  );
  return NextResponse.json({ book }, { status: 201 });
}
