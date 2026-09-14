import { afterEach, describe, expect, it } from "vitest";
import { acquireAiRequest, AiGuardError, resetAiGuardForTests } from "./guard";

function request(address = "203.0.113.8"): Request {
  return new Request("http://localhost/api/debate", {
    headers: { "x-forwarded-for": address },
  });
}

afterEach(() => {
  delete process.env.AI_RATE_LIMIT_PER_MINUTE;
  resetAiGuardForTests();
});

describe("AI request guard", () => {
  it("rejects simultaneous work for the same session stage and releases it safely", () => {
    const first = acquireAiRequest(request(), "debate-turn", "session:opening");
    expect(() =>
      acquireAiRequest(request(), "debate-turn", "session:opening"),
    ).toThrowError(AiGuardError);

    first.release();
    expect(() =>
      acquireAiRequest(request(), "debate-turn", "session:opening").release(),
    ).not.toThrow();
  });

  it("limits requests per client without logging or returning the address", () => {
    process.env.AI_RATE_LIMIT_PER_MINUTE = "2";
    acquireAiRequest(request(), "evaluation", "one").release();
    acquireAiRequest(request(), "evaluation", "two").release();

    try {
      acquireAiRequest(request(), "evaluation", "three");
      throw new Error("Expected the rate limit to reject the request.");
    } catch (error) {
      expect(error).toBeInstanceOf(AiGuardError);
      expect(error).toMatchObject({ status: 429, retryAfterSeconds: 60 });
      expect((error as Error).message).not.toContain("203.0.113.8");
    }
  });
});
