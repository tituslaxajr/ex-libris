import { db, tables } from "@/db";
import { sql } from "drizzle-orm";
import { aiEnabled, getProvider } from "@/lib/ai";
import { getLibraryProfile } from "@/lib/books";
import SettingsPanel from "@/components/settings/SettingsPanel";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getLibraryProfile();
  const [{ n: bookCount }] = await db.select({ n: sql<number>`count(*)` }).from(tables.books);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">Settings</h1>
      <SettingsPanel
        aiEnabled={aiEnabled()}
        provider={getProvider().id}
        chatModel={process.env.AI_CHAT_MODEL ?? "claude-opus-4-8"}
        taskModel={process.env.AI_TASK_MODEL ?? "claude-haiku-4-5-20251001"}
        bookCount={bookCount}
        profileComputedAt={profile?.computedAt ?? null}
        themeKey={profile?.themeKey ?? "hearth"}
        dominantGenres={profile?.dominantGenres ?? []}
      />
    </div>
  );
}
