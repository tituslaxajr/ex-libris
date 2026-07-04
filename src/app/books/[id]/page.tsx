import { notFound } from "next/navigation";
import Link from "next/link";
import { getBookWithMeta } from "@/lib/books";
import { aiEnabled } from "@/lib/ai";
import BookActions from "@/components/books/BookActions";
import ChatPanel from "@/components/chat/ChatPanel";

export const dynamic = "force-dynamic";

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBookWithMeta(Number(id));
  if (!book) notFound();
  const enabled = aiEnabled();

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
