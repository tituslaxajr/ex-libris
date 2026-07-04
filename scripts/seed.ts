import { db, tables } from "../src/db";
import { sql } from "drizzle-orm";

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

type SeedBook = {
  title: string;
  subtitle?: string;
  author: string;
  isbn13?: string;
  publisher?: string;
  publishedYear?: number;
  pageCount?: number;
  status: "unread" | "reading" | "finished" | "reference";
  addedDaysAgo: number;
  acquisitionReason?: string;
  progressPercent?: number;
  currentPage?: number;
};

const SEED_BOOKS: SeedBook[] = [
  {
    title: "Institutes of the Christian Religion",
    author: "John Calvin",
    isbn13: "9780851510552",
    publisher: "Banner of Truth",
    publishedYear: 1559,
    pageCount: 1521,
    status: "unread",
    addedDaysAgo: 400,
    acquisitionReason:
      "Wanted to finally read the foundational text of Reformed theology from the source instead of secondhand summaries.",
  },
  {
    title: "The Holiness of God",
    author: "R.C. Sproul",
    isbn13: "9780842339650",
    publisher: "Tyndale",
    publishedYear: 1985,
    pageCount: 240,
    status: "finished",
    addedDaysAgo: 320,
    acquisitionReason: "Recommended by my pastor as the best introduction to God's character.",
  },
  {
    title: "Knowing God",
    author: "J.I. Packer",
    isbn13: "9780830816507",
    publisher: "IVP",
    publishedYear: 1973,
    pageCount: 286,
    status: "reading",
    addedDaysAgo: 90,
    progressPercent: 42,
    currentPage: 120,
    acquisitionReason: "A modern classic I kept seeing quoted everywhere.",
  },
  {
    title: "The Bruised Reed",
    author: "Richard Sibbes",
    isbn13: "9780851517407",
    publisher: "Banner of Truth",
    publishedYear: 1630,
    pageCount: 138,
    status: "unread",
    addedDaysAgo: 250,
    acquisitionReason: "Heard it deeply comforted Spurgeon during his depression; bought it for hard seasons.",
  },
  {
    title: "The Pilgrim's Progress",
    author: "John Bunyan",
    isbn13: "9780851517575",
    publisher: "Banner of Truth",
    publishedYear: 1678,
    pageCount: 300,
    status: "finished",
    addedDaysAgo: 500,
    acquisitionReason: "The classic allegory everyone should read at least once.",
  },
  {
    title: "Holiness",
    subtitle: "Its Nature, Hindrances, Difficulties, and Roots",
    author: "J.C. Ryle",
    isbn13: "9781848716506",
    publisher: "Banner of Truth",
    publishedYear: 1877,
    pageCount: 462,
    status: "unread",
    addedDaysAgo: 200,
    acquisitionReason: "Wanted a serious, practical treatment of sanctification.",
  },
  {
    title: "The Mortification of Sin",
    author: "John Owen",
    isbn13: "9781800403175",
    publisher: "Banner of Truth",
    publishedYear: 1656,
    pageCount: 144,
    status: "reading",
    addedDaysAgo: 60,
    progressPercent: 25,
    currentPage: 36,
    acquisitionReason: "\"Be killing sin or it will be killing you\" — needed to read the whole argument.",
  },
  {
    title: "Reformed Dogmatics",
    subtitle: "Abridged in One Volume",
    author: "Herman Bavinck",
    isbn13: "9780801036484",
    publisher: "Baker Academic",
    publishedYear: 2011,
    pageCount: 848,
    status: "reference",
    addedDaysAgo: 150,
    acquisitionReason: "A reference work for deeper study alongside sermons and reading.",
  },
  {
    title: "The Whole Christ",
    subtitle: "Legalism, Antinomianism, and Gospel Assurance",
    author: "Sinclair B. Ferguson",
    isbn13: "9781433548000",
    publisher: "Crossway",
    publishedYear: 2016,
    pageCount: 256,
    status: "unread",
    addedDaysAgo: 180,
    acquisitionReason: "The Marrow Controversy sounded obscure but everyone says this book changed how they see grace.",
  },
  {
    title: "The Religious Affections",
    author: "Jonathan Edwards",
    isbn13: "9780851511221",
    publisher: "Banner of Truth",
    publishedYear: 1746,
    pageCount: 382,
    status: "unread",
    addedDaysAgo: 300,
    acquisitionReason: "Wanted Edwards' test for what genuine spiritual experience looks like.",
  },
  {
    title: "Christianity and Liberalism",
    author: "J. Gresham Machen",
    isbn13: "9780802864994",
    publisher: "Eerdmans",
    publishedYear: 1923,
    pageCount: 176,
    status: "finished",
    addedDaysAgo: 220,
    acquisitionReason: "A friend said it reads like it was written yesterday.",
  },
  {
    title: "The Christian's Reasonable Service",
    subtitle: "Volume 1",
    author: "Wilhelmus à Brakel",
    isbn13: "9781601780294",
    publisher: "Reformation Heritage Books",
    publishedYear: 1700,
    pageCount: 656,
    status: "unread",
    addedDaysAgo: 120,
    acquisitionReason: "Dutch Further Reformation piety — bought the set after hearing Joel Beeke commend it.",
  },
];

async function main() {
  const existing = await db.select({ n: sql<number>`count(*)` }).from(tables.books);
  if (existing[0].n > 0) {
    console.log(`Database already has ${existing[0].n} books — skipping seed.`);
    return;
  }

  for (const b of SEED_BOOKS) {
    const [author] = await db
      .insert(tables.authors)
      .values({ name: b.author })
      .onConflictDoUpdate({ target: tables.authors.name, set: { name: b.author } })
      .returning();

    const [book] = await db
      .insert(tables.books)
      .values({
        title: b.title,
        subtitle: b.subtitle,
        isbn13: b.isbn13,
        publisher: b.publisher,
        publishedYear: b.publishedYear,
        pageCount: b.pageCount,
        status: b.status,
        format: "physical",
        addedAt: daysAgo(b.addedDaysAgo),
        acquisitionReason: b.acquisitionReason,
        progressPercent: b.progressPercent ?? (b.status === "finished" ? 100 : 0),
        currentPage: b.currentPage,
        finishedAt: b.status === "finished" ? daysAgo(Math.max(1, b.addedDaysAgo - 60)) : null,
        coverUrl: b.isbn13 ? `https://covers.openlibrary.org/b/isbn/${b.isbn13}-L.jpg` : null,
      })
      .returning();

    await db.insert(tables.bookAuthors).values({ bookId: book.id, authorId: author.id });
  }

  await db
    .insert(tables.libraryProfile)
    .values({ id: 1, themeKey: "hearth", bookCountAtCompute: 0, computedAt: null })
    .onConflictDoNothing();

  console.log(`Seeded ${SEED_BOOKS.length} books.`);
}

main().then(() => process.exit(0));
