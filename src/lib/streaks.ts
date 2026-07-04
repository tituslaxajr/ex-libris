export interface SessionLike {
  startedAt: string;
}

/** Number of consecutive days (ending today or yesterday) with at least one reading session. */
export function currentStreak(sessions: SessionLike[], now: Date = new Date()): number {
  const days = new Set(sessions.map((s) => dayKey(new Date(s.startedAt))));
  let streak = 0;
  const cursor = new Date(now);
  // A streak is still alive if the last read was yesterday.
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function longestStreak(sessions: SessionLike[]): number {
  const days = [...new Set(sessions.map((s) => dayKey(new Date(s.startedAt))))].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of days) {
    run = prev !== null && isNextDay(prev, day) ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = day;
  }
  return longest;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isNextDay(prevKey: string, key: string): boolean {
  const prev = new Date(prevKey + "T00:00:00");
  prev.setDate(prev.getDate() + 1);
  return dayKey(prev) === key;
}
