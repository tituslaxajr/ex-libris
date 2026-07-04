import { NextResponse } from "next/server";
import { aiEnabled, getProvider } from "@/lib/ai";

export async function GET() {
  return NextResponse.json({
    enabled: aiEnabled(),
    provider: getProvider().id,
    chatModel: process.env.AI_CHAT_MODEL ?? "claude-opus-4-8",
    taskModel: process.env.AI_TASK_MODEL ?? "claude-haiku-4-5-20251001",
  });
}
