import ChatPanel from "@/components/chat/ChatPanel";
import { getLibraryProfile } from "@/lib/books";

export const dynamic = "force-dynamic";

export default async function CompanionPage() {
  const profile = await getLibraryProfile();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Reading companion</h1>
      <p className="mt-1 mb-6 text-sm" style={{ color: "var(--ink-soft)" }}>
        {profile?.dominantGenres?.length
          ? `Tuned to your library of ${profile.dominantGenres.slice(0, 2).join(" and ").toLowerCase()}.`
          : "It knows every book on your shelves."}
      </p>
      <ChatPanel />
    </div>
  );
}
