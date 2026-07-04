import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";

const patchSchema = z.object({ completed: z.boolean() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cpId: string }> }
) {
  const { cpId } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [updated] = await db
    .update(tables.planCheckpoints)
    .set({ completedAt: parsed.data.completed ? new Date().toISOString() : null })
    .where(eq(tables.planCheckpoints.id, Number(cpId)))
    .returning();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ checkpoint: updated });
}
