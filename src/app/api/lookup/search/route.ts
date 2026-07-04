import { NextRequest, NextResponse } from "next/server";
import { searchBooks } from "@/lib/metadata";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ results: [] });
  const results = await searchBooks(query);
  return NextResponse.json({ results });
}
