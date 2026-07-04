import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";

const progressSchema = z.object({
  currentPage: z.number().int().min(0).optional(),
  currentCfi: z.string().optional(),
  progressPercent: z.number().min(0).max(100).optional(),
  // When true and progress reaches 100, mark the book finished.
  autoFinish: z.boolean().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = progressSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { autoFinish, ...fields } = parsed.data;

  const updates: Record<string, unknown> = { ...fields };
  // Reading a digital book moves it out of "unread".
  const [current] = await db.select().from(tables.books).where(eq(tables.books.id, Number(id)));
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (current.status === "unread") updates.status = "reading";
  if (autoFinish && (fields.progressPercent ?? 0) >= 99) {
    updates.status = "finished";
    updates.finishedAt = new Date().toISOString();
    updates.progressPercent = 100;
  }

  const [updated] = await db
    .update(tables.books)
    .set(updates)
    .where(eq(tables.books.id, Number(id)))
    .returning();
  return NextResponse.json({ book: updated });
}
