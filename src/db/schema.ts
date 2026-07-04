import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";

export const books = sqliteTable("books", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  sortTitle: text("sort_title"),
  isbn10: text("isbn10"),
  isbn13: text("isbn13"),
  publisher: text("publisher"),
  publishedYear: integer("published_year"),
  pageCount: integer("page_count"),
  coverUrl: text("cover_url"),
  format: text("format", { enum: ["physical", "epub", "pdf"] }).notNull().default("physical"),
  status: text("status", { enum: ["unread", "reading", "finished", "abandoned", "reference"] })
    .notNull()
    .default("unread"),
  acquiredAt: text("acquired_at"),
  acquisitionReason: text("acquisition_reason"),
  addedAt: text("added_at").notNull(),
  finishedAt: text("finished_at"),
  currentPage: integer("current_page"),
  currentCfi: text("current_cfi"),
  progressPercent: real("progress_percent").notNull().default(0),
  aiSummary: text("ai_summary"),
  aiThemes: text("ai_themes", { mode: "json" }).$type<string[]>(),
  aiDifficulty: text("ai_difficulty", { enum: ["intro", "intermediate", "advanced"] }),
  aiEnrichedAt: text("ai_enriched_at"),
  sourceUrl: text("source_url"),
  notes: text("notes"),
});

export const authors = sqliteTable("authors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  sortName: text("sort_name"),
});

export const bookAuthors = sqliteTable(
  "book_authors",
  {
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["author", "editor", "translator"] }).notNull().default("author"),
  },
  (t) => [primaryKey({ columns: [t.bookId, t.authorId, t.role] })]
);

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  kind: text("kind", { enum: ["category", "user", "ai"] }).notNull().default("user"),
});

export const bookTags = sqliteTable(
  "book_tags",
  {
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    confidence: real("confidence"),
  },
  (t) => [primaryKey({ columns: [t.bookId, t.tagId] })]
);

export const bookFiles = sqliteTable("book_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bookId: integer("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: ["epub", "pdf"] }).notNull(),
  storageKey: text("storage_key").notNull(),
  sizeBytes: integer("size_bytes"),
  uploadedAt: text("uploaded_at").notNull(),
});

export const readingSessions = sqliteTable("reading_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bookId: integer("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  startedAt: text("started_at").notNull(),
  minutes: integer("minutes"),
  pagesRead: integer("pages_read"),
  startCfi: text("start_cfi"),
  endCfi: text("end_cfi"),
  note: text("note"),
});

export const readingPlans = sqliteTable("reading_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bookId: integer("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  targetDate: text("target_date"),
  cadence: text("cadence", { mode: "json" }).$type<{ pagesPerDay?: number; chaptersPerWeek?: number }>(),
  status: text("status", { enum: ["active", "done", "paused"] }).notNull().default("active"),
  createdAt: text("created_at").notNull(),
});

export const planCheckpoints = sqliteTable("plan_checkpoints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planId: integer("plan_id")
    .notNull()
    .references(() => readingPlans.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  dueDate: text("due_date"),
  completedAt: text("completed_at"),
});

export const highlights = sqliteTable("highlights", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bookId: integer("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  cfiRange: text("cfi_range"),
  pageNumber: integer("page_number"),
  selectedText: text("selected_text").notNull(),
  color: text("color"),
  note: text("note"),
  createdAt: text("created_at").notNull(),
});

export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bookId: integer("book_id").references(() => books.id, { onDelete: "cascade" }),
  title: text("title"),
  createdAt: text("created_at").notNull(),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
  tokensIn: integer("tokens_in"),
  tokensOut: integer("tokens_out"),
});

export type LibraryTaxonomyEntry = { name: string; description: string };

export const libraryProfile = sqliteTable("library_profile", {
  id: integer("id").primaryKey(),
  dominantGenres: text("dominant_genres", { mode: "json" }).$type<string[]>(),
  taxonomy: text("taxonomy", { mode: "json" }).$type<LibraryTaxonomyEntry[]>(),
  personaPrompt: text("persona_prompt"),
  themeKey: text("theme_key").notNull().default("hearth"),
  computedAt: text("computed_at"),
  bookCountAtCompute: integer("book_count_at_compute").notNull().default(0),
});

export const nudges = sqliteTable("nudges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind", { enum: ["dusty_shelf", "streak", "milestone", "plan_behind"] }).notNull(),
  bookId: integer("book_id").references(() => books.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull(),
  dismissedAt: text("dismissed_at"),
});

export const aiUsage = sqliteTable("ai_usage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  feature: text("feature", {
    enum: ["chat", "enrich", "classify", "nudge", "quiz", "congrats", "plan_nudge"],
  }).notNull(),
  model: text("model").notNull(),
  tier: text("tier", { enum: ["chat", "task"] }).notNull(),
  tokensIn: integer("tokens_in").notNull().default(0),
  tokensOut: integer("tokens_out").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
export type AiUsage = typeof aiUsage.$inferSelect;
export type Author = typeof authors.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type LibraryProfile = typeof libraryProfile.$inferSelect;
export type Nudge = typeof nudges.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
