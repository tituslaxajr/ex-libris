import { notFound } from "next/navigation";
import Link from "next/link";
import { getBookWithMeta, getBookFiles } from "@/lib/books";
import { db, tables } from "@/db";
import { eq, desc } from "drizzle-orm";
import { aiEnabled } from "@/lib/ai";
import BookActions from "@/components/books/BookActions";
import UploadZone from "@/components/books/UploadZone";
import QuizCard from "@/components/books/QuizCard";
import ChatPanel from "@/components/chat/ChatPanel";

export const dynamic = "force-dynamic";

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBookWithMeta(Number(id));
  if (!book) notFound();
  const enabled = aiEnabled();
  const files = await getBookFiles(book.id);
  const hasFile = files.length > 0;
  const highlights = await db
    .select()
    .from(tables.highlights)
    .where(eq(tables.highlights.bookId, book.id))
    .orderBy(desc(tables.highlights.createdAt));

  return (
    <div>
      <Link href="/" className="text-sm underline" style={{ color: "var(--ink-soft)" }}>
        ← Back to shelves
      </Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="flex gap-6">
            {book.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.coverUrl}
                alt={`Cover of ${book.title}`}
                className="h-56 w-auto rounded shadow-lg"
              />
            ) : (
              <div
                className="flex h-56 w-36 items-center justify-center rounded p-3 text-center text-sm font-semibold shadow-lg"
                style={{ background: "var(--shelf-wood)", color: "var(--bg)" }}
              >
                {book.title}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold leading-tight">{book.title}</h1>
              {book.subtitle && (
                <p className="mt-1 text-lg italic" style={{ color: "var(--ink-soft)" }}>
                  {book.subtitle}
                </p>
              )}
              <p className="mt-2" style={{ color: "var(--ink-soft)" }}>
                {book.authors.join(", ") || "Unknown author"}
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
                {[book.publisher, book.publishedYear, book.pageCount ? `${book.pageCount} pages` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {book.category && (
                <span
                  className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: "var(--bg-deep)", color: "var(--ink-soft)" }}
                >
                  {book.category}
                </span>
              )}
            </div>
          </div>

          {(book.aiSummary || book.aiThemes?.length) && (
            <div className="surface-card mt-6 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                Companion’s notes
              </p>
              {book.aiSummary && <p className="mt-2 leading-relaxed">{book.aiSummary}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {book.aiDifficulty && (
                  <span className="rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
                    {book.aiDifficulty}
                  </span>
                )}
                {book.aiThemes?.map((theme) => (
                  <span
                    key={theme}
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{ background: "var(--bg-deep)", color: "var(--ink-soft)" }}
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="surface-card mt-6 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              Read
            </p>
            {hasFile ? (
              <div className="mt-3">
                {book.progressPercent > 0 && (
                  <div className="mb-3">
                    <div className="h-2 w-full rounded-full" style={{ background: "var(--bg-deep)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${book.progressPercent}%`, background: "var(--accent)" }}
                      />
                    </div>
                    <p className="mt-1 text-xs" style={{ color: "var(--ink-soft)" }}>
                      {Math.round(book.progressPercent)}% read
                    </p>
                  </div>
                )}
                <Link href={`/books/${book.id}/read`} className="btn-accent inline-block">
                  {book.progressPercent > 0 ? "Continue reading" : "Open the reader"}
                </Link>
                <Link
                  href="/plans"
                  className="ml-3 text-sm underline"
                  style={{ color: "var(--accent)" }}
                >
                  Start a reading plan →
                </Link>
              </div>
            ) : (
              <div className="mt-3">
                <p className="mb-3 text-sm" style={{ color: "var(--ink-soft)" }}>
                  This is a physical book on your shelf. Have a digital copy? Add it to read and
                  highlight it here.
                </p>
                <UploadZone bookId={book.id} />
              </div>
            )}
          </div>

          <div className="surface-card mt-6 p-5">
            <BookActions
              book={{
                id: book.id,
                status: book.status,
                currentPage: book.currentPage,
                pageCount: book.pageCount,
                progressPercent: book.progressPercent,
                acquisitionReason: book.acquisitionReason,
                aiEnrichedAt: book.aiEnrichedAt,
              }}
              aiEnabled={enabled}
            />
          </div>

          {enabled && (highlights.length > 0 || book.aiSummary) && (
            <div className="mt-6">
              <QuizCard bookId={book.id} />
            </div>
          )}

          {highlights.length > 0 && (
            <div className="surface-card mt-6 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                Highlights ({highlights.length})
              </p>
              <ul className="mt-3 space-y-3">
                {highlights.map((h) => (
                  <li
                    key={h.id}
                    className="border-l-2 pl-3 text-sm italic leading-relaxed"
                    style={{ borderColor: "var(--accent-soft)" }}
                  >
                    “{h.selectedText}”
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--ink-soft)" }}>
            Talk about this book
          </h2>
          <ChatPanel bookId={book.id} placeholder={`Ask about “${book.title}”…`} />
        </div>
      </div>
    </div>
  );
}
