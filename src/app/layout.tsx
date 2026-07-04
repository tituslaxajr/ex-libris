import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getLibraryProfile } from "@/lib/books";

export const metadata: Metadata = {
  title: "Ex Libris",
  description: "Your personal library, alive.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let themeKey = "hearth";
  try {
    const profile = await getLibraryProfile();
    if (profile?.themeKey) themeKey = profile.themeKey;
  } catch {
    // DB not migrated yet — fall back to the default theme.
  }

  return (
    <html lang="en" data-theme={themeKey}>
      <body>
        <header
          className="sticky top-0 z-40 border-b backdrop-blur"
          style={{
            background: "color-mix(in srgb, var(--bg) 85%, transparent)",
            borderColor: "color-mix(in srgb, var(--ink) 12%, transparent)",
          }}
        >
          <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/" className="text-xl font-bold tracking-wide" style={{ color: "var(--accent)" }}>
              Ex Libris
            </Link>
            <div className="flex gap-4 text-sm" style={{ color: "var(--ink-soft)" }}>
              <Link href="/" className="hover:underline">
                Shelves
              </Link>
              <Link href="/books/new" className="hover:underline">
                Add a book
              </Link>
              <Link href="/companion" className="hover:underline">
                Companion
              </Link>
              <Link href="/stats" className="hover:underline">
                Stats
              </Link>
              <Link href="/settings" className="hover:underline">
                Settings
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
