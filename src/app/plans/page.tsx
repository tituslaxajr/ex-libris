import Link from "next/link";
import { db, tables } from "@/db";
import { getBooksWithMeta } from "@/lib/books";
import { planStatus } from "@/lib/plans";
import PlanCreator from "@/components/plans/PlanCreator";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const [plans, books] = await Promise.all([
    db.select().from(tables.readingPlans),
    getBooksWithMeta(),
  ]);
  const bookById = new Map(books.map((b) => [b.id, b]));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reading plans</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
            Turn a daunting book into a finishable schedule.
          </p>
        </div>
      </div>

      <div className="mb-8">
        <PlanCreator books={books.map((b) => ({ id: b.id, title: b.title, pageCount: b.pageCount }))} />
      </div>

      {plans.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          No plans yet. Pick a long book you keep meaning to finish and give it a deadline.
        </p>
      ) : (
        <ul className="space-y-3">
          {plans.map((plan) => {
            const book = bookById.get(plan.bookId);
            const status = planStatus(plan, [], book ?? { progressPercent: 0 });
            return (
              <li key={plan.id}>
                <Link href={`/plans/${plan.id}`} className="surface-card block p-4 hover:opacity-95">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{book?.title ?? "Unknown book"}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{
                        background: status.onPace ? "var(--bg-deep)" : "#f5d9d0",
                        color: status.onPace ? "var(--ink-soft)" : "#b3341f",
                      }}
                    >
                      {plan.status !== "active"
                        ? plan.status
                        : status.onPace
                          ? "on pace"
                          : `${status.behindByDays}d behind`}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full" style={{ background: "var(--bg-deep)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${status.actualPercent}%`, background: "var(--accent)" }}
                    />
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "var(--ink-soft)" }}>
                    {status.actualPercent}% read · finish by {plan.targetDate} · {status.daysRemaining} days left
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
