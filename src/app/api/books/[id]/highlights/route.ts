import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, tables } from "@/db";
import { eq, desc } from "drizzle-orm";

const highlightSchema = z.object({
  selectedText: z.string().min(1),
  cfiRange: z.string().optional(),
  pageNumber: z.number().int().optional(),
  color: z.string().optional(),
  note: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const highlights = await db
    .select()
    .from(tables.highlights)
    .where(eq(tables.highlights.bookId, Number(id)))
    .orderBy(desc(tables.highlights.createdAt));
  return NextResponse.json({ highlights });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = highlightSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [highlight] = await db
    .insert(tables.highlights)
    .values({
      bookId: Number(id),
      createdAt: new Date().toISOString(),
      ...parsed.data,
    })
    .returning();
  return NextResponse.json({ highlight }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const highlightId = Number(req.nextUrl.searchParams.get("highlightId"));
  if (!highlightId) return NextResponse.json({ error: "highlightId required" }, { status: 400 });
  await db
    .delete(tables.highlights)
    .where(eq(tables.highlights.id, highlightId));
  return NextResponse.json({ ok: true });
}
