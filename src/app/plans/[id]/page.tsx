import { notFound } from "next/navigation";
import Link from "next/link";
import { db, tables } from "@/db";
import { eq, asc } from "drizzle-orm";
import { getBookWithMeta } from "@/lib/books";
import { planStatus } from "@/lib/plans";
import CheckpointList from "@/components/plans/CheckpointList";
import PlanNudge from "@/components/plans/PlanNudge";

export const dynamic = "force-dynamic";

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [plan] = await db
    .select()
    .from(tables.readingPlans)
    .where(eq(tables.readingPlans.id, Number(id)));
  if (!plan) notFound();

  const checkpoints = await db
    .select()
    .from(tables.planCheckpoints)
    .where(eq(tables.planCheckpoints.planId, plan.id))
    .orderBy(asc(tables.planCheckpoints.dueDate));

  const book = await getBookWithMeta(plan.bookId);
  const status = planStatus(plan, checkpoints, book ?? { progressPercent: 0 });

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/plans" className="text-sm underline" style={{ color: "var(--ink-soft)" }}>
        ← All plans
      </Link>
      <h1 className="mt-3 text-3xl font-bold">{book?.title ?? "Reading plan"}</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
        Finish by {plan.targetDate} · {status.daysRemaining} days left
      </p>

      {!status.onPace && plan.status === "active" && <div className="mt-4"><PlanNudge planId={plan.id} /></div>}

      <div className="surface-card mt-4 p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold" style={{ color: "var(--accent)" }}>
              {status.actualPercent}%
            </p>
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
              you are here
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">{status.expectedPercent}%</p>
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
              on-pace target
            </p>
          </div>
        </div>
        <div className="mt-3 h-2.5 w-full rounded-full" style={{ background: "var(--bg-deep)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${status.actualPercent}%`, background: "var(--accent)" }}
          />
        </div>
        {book && (
          <Link
            href={`/books/${book.id}/read`}
            className="btn-accent mt-4 inline-block"
          >
            Keep reading
          </Link>
        )}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold italic" style={{ color: "var(--ink-soft)" }}>
        Checkpoints
      </h2>
      <CheckpointList planId={plan.id} checkpoints={checkpoints} />
    </div>
  );
}
