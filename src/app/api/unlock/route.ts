import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  const passcode = process.env.APP_PASSCODE;
  if (!passcode) {
    // No lock configured — nothing to unlock.
    return NextResponse.json({ ok: true });
  }
  const { code } = await req.json().catch(() => ({ code: "" }));
  if (typeof code !== "string" || code !== passcode) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  const hash = createHash("sha256").update(passcode).digest("hex");
  const res = NextResponse.json({ ok: true });
  res.cookies.set("exlibris_auth", hash, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
