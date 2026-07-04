import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, CompletionOptions, CompletionResult } from "./provider";

const CHAT_MODEL = process.env.AI_CHAT_MODEL ?? "claude-opus-4-8";
const TASK_MODEL = process.env.AI_TASK_MODEL ?? "claude-haiku-4-5-20251001";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

function buildRequest(opts: CompletionOptions) {
  const model = opts.tier === "task" ? TASK_MODEL : CHAT_MODEL;
  return {
    model,
    max_tokens: opts.maxTokens ?? (opts.tier === "task" ? 1024 : 2048),
    // cache_control keeps multi-turn chats cheap: the (large) system prompt with
    // library context is cached across turns.
    system: [
      {
        type: "text" as const,
        text: opts.system,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
  };
}

export const anthropicProvider: AIProvider = {
  id: "anthropic",

  isConfigured() {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  },

  async complete(opts: CompletionOptions): Promise<CompletionResult> {
    const req = buildRequest(opts);
    const response = await getClient().messages.create(
      opts.jsonSchema
        ? {
            ...req,
            output_config: {
              format: { type: "json_schema" as const, schema: opts.jsonSchema },
            },
          }
        : req
    );
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    return {
      text,
      tokensIn: response.usage.input_tokens,
      tokensOut: response.usage.output_tokens,
    };
  },

  async *stream(opts: CompletionOptions): AsyncIterable<string> {
    const stream = getClient().messages.stream(buildRequest(opts));
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
    if (opts.onUsage) {
      try {
        const final = await stream.finalMessage();
        opts.onUsage({ tokensIn: final.usage.input_tokens, tokensOut: final.usage.output_tokens });
      } catch {
        // usage is best-effort
      }
    }
  },
};
