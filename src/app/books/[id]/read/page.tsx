import { notFound } from "next/navigation";
import Link from "next/link";
import { getBookWithMeta, getBookFiles } from "@/lib/books";
import { aiEnabled } from "@/lib/ai";
import ReaderShell from "@/components/reader/ReaderShell";

export const dynamic = "force-dynamic";

export default async function ReadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBookWithMeta(Number(id));
  if (!book) notFound();
  const files = await getBookFiles(book.id);
  const file = files[0];

  if (!file) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-2xl font-bold">Nothing to read yet</h1>
        <p className="mt-2" style={{ color: "var(--ink-soft)" }}>
          “{book.title}” doesn’t have a digital file attached. Upload an EPUB or PDF from the book’s
          page to read it here.
        </p>
        <Link href={`/books/${book.id}`} className="btn-accent mt-6 inline-block">
          Back to the book
        </Link>
      </div>
    );
  }

  return (
    <ReaderShell
      bookId={book.id}
      title={book.title}
      kind={file.kind}
      fileId={file.id}
      initialCfi={book.currentCfi}
      initialPage={book.currentPage}
      aiEnabled={aiEnabled()}
    />
  );
}
