import { NextRequest, NextResponse } from "next/server";
import { lookupIsbn } from "@/lib/metadata";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ isbn: string }> }) {
  const { isbn } = await params;
  const metadata = await lookupIsbn(isbn);
  if (!metadata) {
    return NextResponse.json(
      { error: "No book found for that ISBN. You can add it manually." },
      { status: 404 }
    );
  }
  return NextResponse.json({ metadata });
}
