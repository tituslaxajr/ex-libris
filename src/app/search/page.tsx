import SearchBox from "@/components/search/SearchBox";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Search your library</h1>
      <p className="mt-1 mb-6 text-sm" style={{ color: "var(--ink-soft)" }}>
        Across titles, authors, AI summaries, themes, and every passage you’ve highlighted.
      </p>
      <SearchBox />
    </div>
  );
}
