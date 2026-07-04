import Link from "next/link";
import { db, tables } from "@/db";
import { getBooksWithMeta } from "@/lib/books";
import { currentStreak, longestStreak } from "@/lib/streaks";
import { rankDustyBooks } from "@/lib/dusty";

export const dynamic = "force-dynamic";

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="surface-card p-5">
      <p className="text-3xl font-bold" style={{ color: "var(--accent)" }}>
        {value}
      </p>
      <p className="mt-1 text-sm font-semibold">{label}</p>
      {hint && (
        <p className="mt-0.5 text-xs" style={{ color: "var(--ink-soft)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export default async function StatsPage() {
  const sessions = await db.select().from(tables.readingSessions);
  const books = await getBooksWithMeta();

  const weekAgo = Date.now() - 7 * 86400000;
  const recent = sessions.filter((s) => new Date(s.startedAt).getTime() >= weekAgo);
  const minutesThisWeek = recent.reduce((sum, s) => sum + (s.minutes ?? 0), 0);
  const pagesThisWeek = recent.reduce((sum, s) => sum + (s.pagesRead ?? 0), 0);

  const finished = books.filter((b) => b.status === "finished").length;
  const reading = books.filter((b) => b.status === "reading").length;
  const dusty = rankDustyBooks(books);

  const streak = currentStreak(sessions);
  const best = longestStreak(sessions);

  return (
    <div>
      <h1 className="text-3xl font-bold">Your reading</h1>
      <p className="mt-1 mb-6 text-sm" style={{ color: "var(--ink-soft)" }}>
        Every session in the reader counts toward these.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat
          label="Day streak"
          value={streak}
          hint={best > 0 ? `best: ${best} days` : "read today to begin one"}
        />
        <Stat label="Minutes this week" value={minutesThisWeek} />
        <Stat label="Pages this week" value={pagesThisWeek} />
        <Stat label="Books finished" value={finished} />
        <Stat label="Currently reading" value={reading} />
        <Stat label="On the dusty shelf" value={dusty.length} hint="unread books waiting" />
      </div>

      {dusty.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold italic" style={{ color: "var(--ink-soft)" }}>
            Longest neglected
          </h2>
          <ul className="space-y-2">
            {dusty.slice(0, 5).map((d) => (
              <li key={d.book.id}>
                <Link
                  href={`/books/${d.book.id}`}
                  className="surface-card flex items-center justify-between p-3 hover:opacity-90"
                >
                  <span className="font-semibold">{d.book.title}</span>
                  <span className="text-sm" style={{ color: "var(--ink-soft)" }}>
                    {d.daysOnShelf} days
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sessions.length === 0 && (
        <p className="mt-10 text-center text-sm" style={{ color: "var(--ink-soft)" }}>
          No reading sessions yet. Open a book in the reader and your streak begins.
        </p>
      )}
    </div>
  );
}
