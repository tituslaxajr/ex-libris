import { describe, it, expect } from "vitest";
import {
  normalizeOpenLibraryBook,
  normalizeOpenLibrarySearchDoc,
  normalizeGoogleBooksVolume,
  parseYear,
  cleanIsbn,
} from "./normalize";

describe("normalizeOpenLibraryBook", () => {
  it("maps an Open Library edition to BookMetadata", () => {
    const data = {
      title: "Knowing God",
      publishers: ["InterVarsity Press"],
      publish_date: "1973",
      number_of_pages: 286,
      isbn_13: ["9780830816507"],
      isbn_10: ["0830816505"],
      covers: [12345],
      authors: [{ key: "/authors/OL123A" }],
    };
    const meta = normalizeOpenLibraryBook(data, ["J.I. Packer"]);
    expect(meta.title).toBe("Knowing God");
    expect(meta.authors).toEqual(["J.I. Packer"]);
    expect(meta.isbn13).toBe("9780830816507");
    expect(meta.publisher).toBe("InterVarsity Press");
    expect(meta.publishedYear).toBe(1973);
    expect(meta.pageCount).toBe(286);
    expect(meta.coverUrl).toContain("12345-L.jpg");
    expect(meta.source).toBe("openlibrary");
  });

  it("falls back to the queried ISBN for the cover", () => {
    const meta = normalizeOpenLibraryBook({ title: "X" }, [], "9780851510552");
    expect(meta.isbn13).toBe("9780851510552");
    expect(meta.coverUrl).toContain("9780851510552");
  });
});

describe("normalizeOpenLibrarySearchDoc", () => {
  it("maps a search doc", () => {
    const doc = {
      title: "The Bruised Reed",
      author_name: ["Richard Sibbes"],
      isbn: ["0851517404", "9780851517407"],
      publisher: ["Banner of Truth"],
      first_publish_year: 1630,
      cover_i: 999,
    };
    const meta = normalizeOpenLibrarySearchDoc(doc);
    expect(meta.isbn13).toBe("9780851517407");
    expect(meta.isbn10).toBe("0851517404");
    expect(meta.authors).toEqual(["Richard Sibbes"]);
    expect(meta.coverUrl).toContain("999-L.jpg");
  });
});

describe("normalizeGoogleBooksVolume", () => {
  it("maps a Google Books volume", () => {
    const volume = {
      volumeInfo: {
        title: "The Whole Christ",
        subtitle: "Legalism, Antinomianism, and Gospel Assurance",
        authors: ["Sinclair B. Ferguson"],
        publisher: "Crossway",
        publishedDate: "2016-01-14",
        pageCount: 256,
        industryIdentifiers: [
          { type: "ISBN_13", identifier: "9781433548000" },
          { type: "ISBN_10", identifier: "1433548003" },
        ],
        imageLinks: { thumbnail: "http://books.google.com/thumb.jpg" },
      },
    };
    const meta = normalizeGoogleBooksVolume(volume);
    expect(meta.title).toBe("The Whole Christ");
    expect(meta.isbn13).toBe("9781433548000");
    expect(meta.publishedYear).toBe(2016);
    expect(meta.coverUrl).toBe("https://books.google.com/thumb.jpg");
    expect(meta.source).toBe("googlebooks");
  });

  it("handles missing fields", () => {
    const meta = normalizeGoogleBooksVolume({});
    expect(meta.title).toBe("Unknown title");
    expect(meta.authors).toEqual([]);
  });
});

describe("parseYear", () => {
  it("extracts a 4-digit year from various formats", () => {
    expect(parseYear("1973")).toBe(1973);
    expect(parseYear("January 1, 2016")).toBe(2016);
    expect(parseYear("no year")).toBeUndefined();
  });
});

describe("cleanIsbn", () => {
  it("strips separators and keeps check digit X", () => {
    expect(cleanIsbn("978-0-8308-1650-7")).toBe("9780830816507");
    expect(cleanIsbn("0 85151 740 x")).toBe("085151740X");
  });
});
