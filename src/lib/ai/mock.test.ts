import { describe, it, expect } from "vitest";
import { mockProvider } from "./mock";
import { CLASSIFY_SCHEMA, ENRICH_SCHEMA } from "./prompts";

describe("mock provider contract", () => {
  it("is always configured", () => {
    expect(mockProvider.isConfigured()).toBe(true);
  });

  it("returns parseable JSON for classification requests", async () => {
    const result = await mockProvider.complete({
      system: "You are a librarian.",
      messages: [{ role: "user", content: "Classify this personal library. ..." }],
      jsonSchema: CLASSIFY_SCHEMA as unknown as Record<string, unknown>,
    });
    const parsed = JSON.parse(result.text);
    expect(parsed.taxonomy.length).toBeGreaterThan(0);
    expect(parsed.themeKey).toBeTruthy();
    expect(typeof parsed.personaPrompt).toBe("string");
  });

  it("returns parseable JSON for enrichment requests", async () => {
    const result = await mockProvider.complete({
      system: "companion",
      messages: [{ role: "user", content: "Enrich this book entry ..." }],
      jsonSchema: ENRICH_SCHEMA as unknown as Record<string, unknown>,
    });
    const parsed = JSON.parse(result.text);
    expect(parsed.summary).toBeTruthy();
    expect(["intro", "intermediate", "advanced"]).toContain(parsed.difficulty);
  });

  it("streams text chunks", async () => {
    let text = "";
    for await (const chunk of mockProvider.stream({
      system: "companion",
      messages: [{ role: "user", content: "hello" }],
    })) {
      text += chunk;
    }
    expect(text.length).toBeGreaterThan(10);
  });
});
