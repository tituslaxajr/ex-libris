import { NextRequest, NextResponse } from "next/server";
import { searchLibrary } from "@/lib/search";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });
  const results = await searchLibrary(q);
  return NextResponse.json({ results });
}
