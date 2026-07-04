"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ChatPanel from "@/components/chat/ChatPanel";

const EpubReader = dynamic(() => import("./EpubReader"), {
  ssr: false,
  loading: () => <p className="p-8 text-center text-sm">Opening the book…</p>,
});
const PdfReader = dynamic(() => import("./PdfReader"), {
  ssr: false,
  loading: () => <p className="p-8 text-center text-sm">Opening the book…</p>,
});

interface Props {
  bookId: number;
  title: string;
  kind: "epub" | "pdf";
  fileId: number;
  initialCfi: string | null;
  initialPage: number | null;
  aiEnabled: boolean;
}

export default function ReaderShell({
  bookId,
  title,
  kind,
  fileId,
  initialCfi,
  initialPage,
  aiEnabled,
}: Props) {
  const [chapterText, setChapterText] = useState<string>("");
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      <div className="flex items-center justify-between px-4 py-2">
        <Link href={`/books/${bookId}`} className="text-sm underline" style={{ color: "var(--ink-soft)" }}>
          ← {title}
        </Link>
        {aiEnabled && (
          <button className="btn-quiet text-sm" onClick={() => setChatOpen((o) => !o)}>
            {chatOpen ? "Close companion" : "Discuss this chapter"}
          </button>
        )}
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden border-r" style={{ borderColor: "color-mix(in srgb, var(--ink) 12%, transparent)" }}>
          {kind === "epub" ? (
            <EpubReader
              bookId={bookId}
              fileId={fileId}
              initialCfi={initialCfi}
              onChapterText={setChapterText}
            />
          ) : (
            <PdfReader bookId={bookId} fileId={fileId} initialPage={initialPage} />
          )}
        </div>
        {chatOpen && aiEnabled && (
          <div className="w-[380px] shrink-0 overflow-hidden p-3">
            <ChatPanel
              bookId={bookId}
              contextText={chapterText}
              placeholder="Ask about this part…"
            />
          </div>
        )}
      </div>
    </div>
  );
}
