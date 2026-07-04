import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, tables } from "@/db";
import { eq, asc } from "drizzle-orm";

const patchSchema = z.object({
  status: z.enum(["active", "paused", "done"]),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const [plan] = await db
    .select()
    .from(tables.readingPlans)
    .where(eq(tables.readingPlans.id, Number(id)));
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const checkpoints = await db
    .select()
    .from(tables.planCheckpoints)
    .where(eq(tables.planCheckpoints.planId, plan.id))
    .orderBy(asc(tables.planCheckpoints.dueDate));
  return NextResponse.json({ plan, checkpoints });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [updated] = await db
    .update(tables.readingPlans)
    .set({ status: parsed.data.status })
    .where(eq(tables.readingPlans.id, Number(id)))
    .returning();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ plan: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await db.delete(tables.readingPlans).where(eq(tables.readingPlans.id, Number(id)));
  return NextResponse.json({ ok: true });
}
