import type { AIProvider } from "./provider";
import { anthropicProvider } from "./anthropic";
import { mockProvider } from "./mock";

export function getProvider(): AIProvider {
  const configured = process.env.AI_PROVIDER;
  if (configured === "mock") return mockProvider;
  if (anthropicProvider.isConfigured()) return anthropicProvider;
  return mockProvider;
}

/** True when a real (non-mock) AI backend is usable. Drives graceful degradation in the UI. */
export function aiEnabled(): boolean {
  return process.env.AI_PROVIDER === "mock" || anthropicProvider.isConfigured();
}

export type { AIProvider, ChatMessage, CompletionOptions } from "./provider";
