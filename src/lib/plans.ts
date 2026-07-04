import type { Book } from "@/db/schema";

export interface GeneratedCheckpoint {
  label: string;
  dueDate: string; // ISO date
  targetPercent: number; // cumulative % of the book due by this checkpoint
}

export interface PlanLike {
  createdAt: string;
  targetDate: string | null;
  status: "active" | "done" | "paused";
}

export interface CheckpointLike {
  dueDate: string | null;
  completedAt: string | null;
}

export interface PlanStatus {
  expectedPercent: number; // where you "should" be today
  actualPercent: number; // where you actually are
  onPace: boolean;
  behindByDays: number; // how many days of reading you're behind (0 if on pace)
  nextDue: string | null; // ISO date of the next incomplete checkpoint
  daysRemaining: number;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Split a book into `count` evenly spaced checkpoints between `now` and
 * `targetDate`. Uses page ranges when the page count is known, otherwise
 * percentage milestones.
 */
export function generateCheckpoints(
  book: Pick<Book, "pageCount">,
  targetDate: string,
  count: number,
  now: Date = new Date()
): GeneratedCheckpoint[] {
  const n = Math.max(1, Math.min(50, Math.floor(count)));
  const start = now.getTime();
  const end = new Date(targetDate + "T00:00:00").getTime();
  const span = Math.max(end - start, 86400000); // at least a day
  const pages = book.pageCount ?? 0;

  const checkpoints: GeneratedCheckpoint[] = [];
  let prevPage = 0;
  for (let i = 1; i <= n; i++) {
    const fraction = i / n;
    const dueDate = isoDate(new Date(start + span * fraction));
    const targetPercent = Math.round(fraction * 100);
    let label: string;
    if (pages > 0) {
      const toPage = Math.round(pages * fraction);
      label = `Pages ${prevPage + 1}–${toPage}`;
      prevPage = toPage;
    } else {
      label = `Read to ${targetPercent}%`;
    }
    checkpoints.push({ label, dueDate, targetPercent });
  }
  return checkpoints;
}

/**
 * Compare where the reader should be (by elapsed time) against where they
 * actually are (book progress + completed checkpoints).
 */
export function planStatus(
  plan: PlanLike,
  checkpoints: CheckpointLike[],
  book: Pick<Book, "progressPercent">,
  now: Date = new Date()
): PlanStatus {
  const start = new Date(plan.createdAt).getTime();
  const end = plan.targetDate ? new Date(plan.targetDate + "T00:00:00").getTime() : start;
  const total = Math.max(end - start, 86400000);
  const elapsed = Math.min(Math.max(now.getTime() - start, 0), total);
  const expectedPercent = Math.round((elapsed / total) * 100);
  const actualPercent = Math.round(book.progressPercent ?? 0);

  const daysRemaining = Math.max(0, Math.ceil((end - now.getTime()) / 86400000));
  const pointsBehind = Math.max(0, expectedPercent - actualPercent);
  // Convert the percentage gap into days-of-pace behind.
  const percentPerDay = 100 / (total / 86400000);
  const behindByDays = percentPerDay > 0 ? Math.round(pointsBehind / percentPerDay) : 0;

  const nextDue =
    checkpoints
      .filter((c) => !c.completedAt && c.dueDate)
      .map((c) => c.dueDate as string)
      .sort()[0] ?? null;

  return {
    expectedPercent,
    actualPercent,
    onPace: actualPercent >= expectedPercent - 5, // 5-point grace
    behindByDays,
    nextDue,
    daysRemaining,
  };
}
