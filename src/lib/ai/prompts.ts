import type { Book, LibraryProfile } from "@/db/schema";

// Faithfulness rules included in every AI prompt. The companion must discuss
// books accurately, cite them, and never fabricate quotations.
const FAITHFULNESS_RULES = `
Rules you must always follow:
- When making a claim about a book's content, cite the book (and chapter or section when you can).
- Never fabricate quotations. Quote verbatim ONLY from text supplied to you in this conversation. Otherwise paraphrase, and say that you are paraphrasing.
- For books whose text you have not been given, discuss them at the level of general knowledge about the work, and mark uncertainty honestly ("as I recall", "I may be misremembering the details").
- Represent each author's own position faithfully and charitably, in the book's own terms. Where traditions disagree, describe the disagreement with humility rather than adjudicating it.
- You are a companion to the user's reading, not a replacement for it. Encourage them toward the books themselves.`;

const BASE_PROMPT = `You are the reading companion inside "Ex Libris", the user's personal library app. You help them catalogue, read, discuss, and learn from the books they own — and you gently encourage them to read books they have bought but not yet opened.`;

export function companionSystemPrompt(profile: LibraryProfile | undefined, extra?: string): string {
  const persona = profile?.personaPrompt ? `\n\nPersona for this library:\n${profile.personaPrompt}` : "";
  return `${BASE_PROMPT}${persona}\n${FAITHFULNESS_RULES}${extra ? `\n\n${extra}` : ""}`;
}

export function bookContext(book: Book, authors: string[]): string {
  const lines = [
    `Book in focus:`,
    `Title: ${book.title}${book.subtitle ? ` — ${book.subtitle}` : ""}`,
    `Author(s): ${authors.join(", ") || "unknown"}`,
    book.publisher ? `Publisher: ${book.publisher}` : null,
    book.publishedYear ? `First published: ${book.publishedYear}` : null,
    `Reading status: ${book.status}${book.progressPercent ? ` (${Math.round(book.progressPercent)}% through)` : ""}`,
    book.acquisitionReason ? `Why the user bought it: ${book.acquisitionReason}` : null,
    book.aiSummary ? `Summary on file: ${book.aiSummary}` : null,
    book.aiThemes?.length ? `Themes: ${book.aiThemes.join(", ")}` : null,
    book.notes ? `User's notes: ${book.notes}` : null,
  ];
  return lines.filter(Boolean).join("\n");
}

export function libraryContext(
  books: Array<{ title: string; authors: string; status: string; themes?: string[] | null; summary?: string | null }>
): string {
  const lines = books.map(
    (b) =>
      `- "${b.title}" by ${b.authors} [${b.status}]` +
      (b.themes?.length ? ` themes: ${b.themes.join(", ")}` : "")
  );
  return `The user's catalogued library (${books.length} books):\n${lines.join("\n")}`;
}

export const ENRICH_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "2-4 sentence summary of the book" },
    themes: { type: "array", items: { type: "string" }, description: "3-6 short theme keywords" },
    difficulty: { type: "string", enum: ["intro", "intermediate", "advanced"] },
  },
  required: ["summary", "themes", "difficulty"],
  additionalProperties: false,
} as const;

export function enrichPrompt(book: Book, authors: string[]): string {
  return `Enrich this book entry for the user's personal library catalogue. Base the summary on general knowledge of the work; do not invent details for books you do not know — in that case give a cautious summary from the title and say it is inferred.\n\n${bookContext(book, authors)}`;
}

export const CLASSIFY_SCHEMA = {
  type: "object",
  properties: {
    dominantGenres: {
      type: "array",
      items: { type: "string" },
      description: "Ranked list of the library's dominant genres, most dominant first",
    },
    taxonomy: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
        required: ["name", "description"],
        additionalProperties: false,
      },
      description: "5-8 shelf categories tailored to THIS collection",
    },
    bookCategories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          bookId: { type: "integer" },
          category: { type: "string", description: "Must be one of the taxonomy names" },
        },
        required: ["bookId", "category"],
        additionalProperties: false,
      },
    },
    personaPrompt: {
      type: "string",
      description:
        "2-3 sentences describing the persona the reading companion should adopt for this collection: tone, depth, sensibilities",
    },
    themeKey: {
      type: "string",
      enum: ["study", "hearth", "gallery", "observatory", "conservatory"],
      description:
        "Visual theme: study=dark wood/parchment for theology, philosophy, classics; hearth=warm neutral default; gallery=clean modern for art/design/contemporary; observatory=deep blue for sci-fi/science; conservatory=green for nature/poetry/fiction",
    },
  },
  required: ["dominantGenres", "taxonomy", "bookCategories", "personaPrompt", "themeKey"],
  additionalProperties: false,
} as const;

export function classifyPrompt(books: Array<{ id: number; title: string; authors: string }>): string {
  const list = books.map((b) => `${b.id}. "${b.title}" by ${b.authors}`).join("\n");
  return `Classify this personal library. From the catalogue below, determine the dominant genres, design a shelf taxonomy suited to this specific collection, assign every book to exactly one category, write a companion persona, and choose the visual theme that best fits.\n\nCatalogue:\n${list}`;
}

export function nudgePrompt(book: Book, authors: string[], daysUnread: number): string {
  return `Write a short, warm encouragement (2-3 sentences, no headings) nudging the user to finally start a book that has sat unread on their shelf for about ${daysUnread} days. Reference why they bought it if known. Be gentle and motivating, never guilt-tripping.\n\n${bookContext(book, authors)}`;
}
