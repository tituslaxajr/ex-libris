import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { generateCheckpoints } from "@/lib/plans";

const createSchema = z.object({
  bookId: z.number().int(),
  title: z.string().min(1).optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkpointCount: z.number().int().min(1).max(50).default(6),
});

export async function GET() {
  const plans = await db.select().from(tables.readingPlans);
  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { bookId, targetDate, checkpointCount } = parsed.data;

  const [book] = await db.select().from(tables.books).where(eq(tables.books.id, bookId));
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  const now = new Date();
  const [plan] = await db
    .insert(tables.readingPlans)
    .values({
      bookId,
      title: parsed.data.title ?? `${book.title} by ${targetDate}`,
      targetDate,
      cadence: {},
      status: "active",
      createdAt: now.toISOString(),
    })
    .returning();

  const checkpoints = generateCheckpoints(book, targetDate, checkpointCount, now);
  await db.insert(tables.planCheckpoints).values(
    checkpoints.map((c) => ({
      planId: plan.id,
      label: c.label,
      dueDate: c.dueDate,
    }))
  );

  return NextResponse.json({ plan }, { status: 201 });
}
