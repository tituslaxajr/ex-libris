import Bookshelf, { ShelfGroup } from "@/components/shelf/Bookshelf";
import DustyShelfCard from "@/components/nudges/DustyShelfCard";
import { getBooksWithMeta, getLibraryProfile } from "@/lib/books";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  reading: "Currently reading",
  unread: "Waiting to be read",
  finished: "Finished",
  reference: "Reference",
  abandoned: "Set aside",
};

export default async function Home() {
  const books = await getBooksWithMeta();
  const profile = await getLibraryProfile();

  // Group by AI taxonomy category when available, otherwise by reading status.
  const groups: ShelfGroup[] = [];
  const hasCategories = books.some((b) => b.category);
  if (hasCategories && profile?.taxonomy) {
    for (const entry of profile.taxonomy) {
      const shelf = books.filter((b) => b.category === entry.name);
      if (shelf.length > 0)
        groups.push({
          label: entry.name,
          books: shelf.map((b) => ({
            id: b.id,
            title: b.title,
            authors: b.authors,
            status: b.status,
            pageCount: b.pageCount,
            progressPercent: b.progressPercent,
          })),
        });
    }
    const uncategorized = books.filter((b) => !b.category);
    if (uncategorized.length > 0)
      groups.push({
        label: "Unsorted",
        books: uncategorized.map((b) => ({
          id: b.id,
          title: b.title,
          authors: b.authors,
          status: b.status,
          pageCount: b.pageCount,
          progressPercent: b.progressPercent,
        })),
      });
  } else {
    for (const status of ["reading", "unread", "finished", "reference", "abandoned"]) {
      const shelf = books.filter((b) => b.status === status);
      if (shelf.length > 0)
        groups.push({
          label: STATUS_LABELS[status],
          books: shelf.map((b) => ({
            id: b.id,
            title: b.title,
            authors: b.authors,
            status: b.status,
            pageCount: b.pageCount,
            progressPercent: b.progressPercent,
          })),
        });
    }
  }

  const genres = profile?.dominantGenres?.slice(0, 3);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Your library</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
          {books.length} books
          {genres?.length ? ` · mostly ${genres.join(", ").toLowerCase()}` : ""}
        </p>
      </div>
      <DustyShelfCard />
      <Bookshelf groups={groups} />
    </div>
  );
}
