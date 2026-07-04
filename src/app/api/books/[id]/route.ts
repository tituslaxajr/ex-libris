import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { getBookWithMeta } from "@/lib/books";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().nullable().optional(),
  status: z.enum(["unread", "reading", "finished", "abandoned", "reference"]).optional(),
  currentPage: z.number().int().min(0).nullable().optional(),
  progressPercent: z.number().min(0).max(100).optional(),
  pageCount: z.number().int().positive().nullable().optional(),
  acquisitionReason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const book = await getBookWithMeta(Number(id));
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ book });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const updates: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "finished") {
    updates.finishedAt = new Date().toISOString();
    updates.progressPercent = 100;
  }
  const [updated] = await db
    .update(tables.books)
    .set(updates)
    .where(eq(tables.books.id, Number(id)))
    .returning();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ book: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await db.delete(tables.books).where(eq(tables.books.id, Number(id)));
  return NextResponse.json({ ok: true });
}
