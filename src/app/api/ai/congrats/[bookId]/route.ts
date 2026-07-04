import { NextRequest, NextResponse } from "next/server";
import { aiEnabled, getProvider } from "@/lib/ai";
import { companionSystemPrompt, congratsPrompt } from "@/lib/ai/prompts";
import { getBookWithMeta, getLibraryProfile } from "@/lib/books";
import { recordUsage } from "@/lib/ai/usage";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = await getBookWithMeta(Number(bookId));
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const template = `You finished “${book.title}.” That's a real accomplishment — enjoy the satisfaction of a book well read.`;
  if (!aiEnabled()) return NextResponse.json({ message: template });

  try {
    const profile = await getLibraryProfile();
    const result = await getProvider().complete({
      system: companionSystemPrompt(profile),
      messages: [{ role: "user", content: congratsPrompt(book, book.authors) }],
      maxTokens: 200,
      tier: "task",
    });
    await recordUsage({ feature: "congrats", tier: "task", tokensIn: result.tokensIn, tokensOut: result.tokensOut });
    return NextResponse.json({ message: result.text.trim() || template });
  } catch {
    return NextResponse.json({ message: template });
  }
}
