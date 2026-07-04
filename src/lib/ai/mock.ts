import type { AIProvider, CompletionOptions, CompletionResult } from "./provider";

// Deterministic canned responses so the app (and tests, and CI) work with no
// API key. Keyed on markers the prompts include.

function mockJson(opts: CompletionOptions): string {
  const prompt = (opts.system + " " + opts.messages.map((m) => m.content).join(" ")).toLowerCase();
  if (prompt.includes("classify this personal library")) {
    return JSON.stringify({
      dominantGenres: ["Reformed Theology", "Christian Living", "Church History"],
      taxonomy: [
        { name: "Systematic Theology", description: "Doctrinal works treating theology topically" },
        { name: "Biblical Commentary", description: "Verse-by-verse exposition of Scripture" },
        { name: "Church History", description: "History of the church and its figures" },
        { name: "Practical & Devotional", description: "Books for the Christian life and piety" },
        { name: "Puritan Classics", description: "Works by the English Puritans and their heirs" },
      ],
      bookCategories: [],
      personaPrompt:
        "You are a warm, theologically careful reading companion for a library rich in Reformed theology. Speak with pastoral warmth, cite books precisely, and hold doctrinal claims with humility.",
      themeKey: "study",
    });
  }
  if (prompt.includes("enrich this book")) {
    return JSON.stringify({
      summary:
        "A mock summary: this book explores its subject with care, tracing the argument from first principles to practical application.",
      themes: ["grace", "perseverance", "doctrine"],
      difficulty: "intermediate",
    });
  }
  return JSON.stringify({ note: "mock structured response" });
}

function mockText(opts: CompletionOptions): string {
  const prompt = (opts.system + " " + opts.messages.map((m) => m.content).join(" ")).toLowerCase();
  if (prompt.includes("write a short, warm encouragement")) {
    return "That book has been waiting patiently on your shelf. You bought it for a reason — perhaps this week is the time to open it to the first chapter. Even ten pages is a beginning.";
  }
  return "This is a mock response from the offline AI provider. Add an Anthropic API key in your environment to enable the real reading companion.";
}

export const mockProvider: AIProvider = {
  id: "mock",

  isConfigured() {
    return true;
  },

  async complete(opts: CompletionOptions): Promise<CompletionResult> {
    const text = opts.jsonSchema ? mockJson(opts) : mockText(opts);
    return { text, tokensIn: 0, tokensOut: 0 };
  },

  async *stream(opts: CompletionOptions): AsyncIterable<string> {
    const words = mockText(opts).split(" ");
    for (const word of words) {
      yield word + " ";
      await new Promise((r) => setTimeout(r, 15));
    }
  },
};
