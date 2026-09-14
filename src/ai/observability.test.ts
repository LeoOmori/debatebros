import { describe, expect, it } from "vitest";
import { estimateCostUsd } from "./observability";

describe("AI cost estimation", () => {
  it("uses the documented September 2026 paid rates", () => {
    expect(
      estimateCostUsd("gemini-3.8-flash", { inputTokens: 1_000_000, outputTokens: 1_000_000 }),
    ).toBe(4.5);
    expect(
      estimateCostUsd("gemini-3.1-pro-preview", { inputTokens: 1_000, outputTokens: 1_000 }),
    ).toBe(0.014);
  });

  it("returns null instead of inventing a price for an unknown model", () => {
    expect(estimateCostUsd("custom-model", { inputTokens: 100, outputTokens: 100 })).toBeNull();
  });
});
