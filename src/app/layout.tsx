import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getLibraryProfile } from "@/lib/books";
import RegisterSW from "@/components/pwa/RegisterSW";
import ThemeToggle from "@/components/ThemeToggle";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ex Libris",
  description: "Your personal library, alive.",
  appleWebApp: { capable: true, title: "Ex Libris" },
};

export const viewport: Viewport = {
  themeColor: "#7c1f1c",
};

// Runs before paint: if the reader last chose lamplight, force the dark theme
// so there's no flash of the daytime palette.
const NO_FLASH = `try{if(localStorage.getItem('exlibris-mode')==='night'){document.documentElement.setAttribute('data-theme','observatory')}}catch(e){}`;

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
    <html
      lang="en"
      data-theme={themeKey}
      data-theme-base={themeKey}
      className={`${inter.variable} ${sourceSerif.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
        <header
          className="sticky top-0 z-40 border-b backdrop-blur"
          style={{
            background: "color-mix(in srgb, var(--bg) 85%, transparent)",
            borderColor: "color-mix(in srgb, var(--ink) 12%, transparent)",
          }}
        >
          <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link
              href="/"
              className="text-xl font-bold"
              style={{ color: "var(--accent)", fontFamily: "var(--font-serif)" }}
            >
              Ex Libris
            </Link>
            <div
              className="flex flex-1 items-center gap-4 text-[0.7rem] uppercase tracking-[0.14em]"
              style={{ color: "var(--ink-soft)" }}
            >
              <Link href="/" className="hover:underline" style={{ color: "var(--accent)" }}>
                Shelves
              </Link>
              <Link href="/books/new" className="hover:underline">
                Add
              </Link>
              <Link href="/companion" className="hover:underline">
                Companion
              </Link>
              <Link href="/plans" className="hover:underline">
                Plans
              </Link>
              <Link href="/search" className="hover:underline">
                Search
              </Link>
              <Link href="/stats" className="hover:underline">
                Stats
              </Link>
              <Link href="/settings" className="hover:underline">
                Settings
              </Link>
              <ThemeToggle />
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <RegisterSW />
      </body>
    </html>
  );
}
