import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, tables } from "@/db";
import { eq, asc } from "drizzle-orm";
import { aiEnabled, getProvider } from "@/lib/ai";
import { companionSystemPrompt, bookContext, libraryContext } from "@/lib/ai/prompts";
import { getBooksWithMeta, getLibraryProfile } from "@/lib/books";

const chatSchema = z.object({
  message: z.string().min(1).max(8000),
  conversationId: z.number().int().optional(),
  bookId: z.number().int().nullable().optional(),
  // Verbatim text from the passage the user is currently reading, so the
  // companion can quote it accurately.
  contextText: z.string().max(12000).optional(),
});

export async function POST(req: NextRequest) {
  if (!aiEnabled()) {
    return NextResponse.json(
      { error: "AI is not configured. Add an Anthropic API key in your environment." },
      { status: 503 }
    );
  }
  const parsed = chatSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { message, bookId, contextText } = parsed.data;
  let { conversationId } = parsed.data;

  const now = new Date().toISOString();
  if (!conversationId) {
    const [conv] = await db
      .insert(tables.conversations)
      .values({ bookId: bookId ?? null, createdAt: now, title: message.slice(0, 80) })
      .returning();
    conversationId = conv.id;
  }

  const history = await db
    .select()
    .from(tables.messages)
    .where(eq(tables.messages.conversationId, conversationId))
    .orderBy(asc(tables.messages.id));

  await db.insert(tables.messages).values({
    conversationId,
    role: "user",
    content: message,
    createdAt: now,
  });

  // Assemble grounding context: the profile persona plus either the focused
  // book or a compact whole-library listing.
  const profile = await getLibraryProfile();
  const books = await getBooksWithMeta();
  let extra: string;
  if (bookId) {
    const book = books.find((b) => b.id === bookId);
    extra = book
      ? bookContext(book, book.authors)
      : libraryContext(books.map((b) => ({ title: b.title, authors: b.authors.join(", "), status: b.status, themes: b.aiThemes })));
  } else {
    extra = libraryContext(
      books.map((b) => ({ title: b.title, authors: b.authors.join(", "), status: b.status, themes: b.aiThemes }))
    );
  }
  if (contextText) {
    extra += `\n\nThe user is currently reading this passage. You may quote it verbatim; treat it as the only text you have direct access to:\n"""\n${contextText}\n"""`;
  }
  const system = companionSystemPrompt(profile, extra);

  const chatMessages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: message },
  ];

  const provider = getProvider();
  const encoder = new TextEncoder();
  let full = "";

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`event: meta\ndata: ${JSON.stringify({ conversationId })}\n\n`)
      );
      try {
        for await (const chunk of provider.stream({ system, messages: chatMessages, maxTokens: 2048 })) {
          full += chunk;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        }
        await db.insert(tables.messages).values({
          conversationId,
          role: "assistant",
          content: full,
          createdAt: new Date().toISOString(),
        });
        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "AI request failed";
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
