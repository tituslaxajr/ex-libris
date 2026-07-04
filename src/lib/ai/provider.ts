export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CompletionOptions {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  /** When set, the model is constrained to return JSON matching this schema. */
  jsonSchema?: Record<string, unknown>;
  /** "chat" uses the high-quality conversation model; "task" uses the cheap background model. */
  tier?: "chat" | "task";
}

export interface CompletionResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
}

export interface AIProvider {
  readonly id: string;
  isConfigured(): boolean;
  complete(opts: CompletionOptions): Promise<CompletionResult>;
  stream(opts: CompletionOptions): AsyncIterable<string>;
}
