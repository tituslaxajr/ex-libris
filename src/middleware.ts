import { NextRequest, NextResponse } from "next/server";

// Opt-in passcode lock. With APP_PASSCODE unset the app is fully open (default).
// When set, every request must carry a cookie whose value is sha256(passcode).

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(req: NextRequest) {
  const passcode = process.env.APP_PASSCODE;
  if (!passcode) return NextResponse.next();

  const expected = await sha256Hex(passcode);
  const cookie = req.cookies.get("exlibris_auth")?.value;
  if (cookie && cookie === expected) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Locked. Unlock the app first." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/unlock";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except the unlock flow, Next internals, the manifest, the
  // service worker, and icon assets.
  matcher: ["/((?!unlock|api/unlock|_next/|manifest.webmanifest|sw.js|icon-|apple-icon|favicon).*)"],
};
