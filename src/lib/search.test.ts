import { describe, it, expect } from "vitest";
import { buildSearchContent } from "./search";

describe("buildSearchContent", () => {
  const book = {
    id: 7,
    title: "The Whole Christ",
    subtitle: "Legalism, Antinomianism, and Gospel Assurance",
    aiSummary: "On the Marrow Controversy and the nature of grace.",
    aiThemes: ["grace", "assurance", "legalism"],
  };

  it("flattens book fields, authors, and highlights into one indexable doc", () => {
    const doc = buildSearchContent(book, ["Sinclair Ferguson"], [
      "Assurance flows from union with Christ.",
    ]);
    expect(doc.bookId).toBe(7);
    expect(doc.title).toContain("The Whole Christ");
    expect(doc.title).toContain("Gospel Assurance");
    expect(doc.authors).toBe("Sinclair Ferguson");
    expect(doc.themes).toBe("grace, assurance, legalism");
    expect(doc.highlights).toContain("union with Christ");
  });

  it("tolerates missing summary, themes, and highlights", () => {
    const doc = buildSearchContent(
      { id: 1, title: "X", subtitle: null, aiSummary: null, aiThemes: null },
      [],
      []
    );
    expect(doc.title).toBe("X");
    expect(doc.authors).toBe("");
    expect(doc.summary).toBe("");
    expect(doc.themes).toBe("");
    expect(doc.highlights).toBe("");
  });
});
