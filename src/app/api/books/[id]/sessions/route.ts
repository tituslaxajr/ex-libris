import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, tables } from "@/db";
import { eq, desc } from "drizzle-orm";

const sessionSchema = z.object({
  minutes: z.number().int().min(0).optional(),
  pagesRead: z.number().int().min(0).optional(),
  startCfi: z.string().optional(),
  endCfi: z.string().optional(),
  note: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessions = await db
    .select()
    .from(tables.readingSessions)
    .where(eq(tables.readingSessions.bookId, Number(id)))
    .orderBy(desc(tables.readingSessions.startedAt));
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = sessionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [session] = await db
    .insert(tables.readingSessions)
    .values({
      bookId: Number(id),
      startedAt: new Date().toISOString(),
      ...parsed.data,
    })
    .returning();
  return NextResponse.json({ session }, { status: 201 });
}
