"use client";

import BookSpine, { SpineBook } from "./BookSpine";

export interface ShelfGroup {
  label: string;
  books: SpineBook[];
}

export default function Bookshelf({ groups }: { groups: ShelfGroup[] }) {
  if (groups.length === 0) {
    return (
      <div className="surface-card p-10 text-center">
        <p className="text-lg">Your shelves are empty.</p>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-soft)" }}>
          Add your first book and the library will come to life.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="mb-2 text-lg font-semibold italic" style={{ color: "var(--ink-soft)" }}>
            {group.label}
            <span className="ml-2 text-xs not-italic opacity-70">{group.books.length}</span>
          </h2>
          <div
            className="rounded-lg px-4 pt-6"
            style={{ background: "var(--shelf-back)" }}
          >
            <div className="flex min-h-[190px] flex-wrap items-end gap-[3px] px-2">
              {group.books.map((book) => (
                <BookSpine key={book.id} book={book} />
              ))}
            </div>
            {/* shelf plank */}
            <div
              className="-mx-4 h-4 rounded-b-lg"
              style={{
                background: `linear-gradient(var(--shelf-wood), var(--shelf-wood-dark))`,
                boxShadow: "0 3px 6px rgba(0,0,0,0.35)",
              }}
            />
          </div>
        </section>
      ))}
    </div>
  );
}
