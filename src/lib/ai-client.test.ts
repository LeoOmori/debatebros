import { afterEach, describe, expect, it, vi } from "vitest";
import { createDebateSession } from "@/domain";
import { requestEvaluation, streamCharacterTurn } from "./ai-client";

const session = createDebateSession({
  id: "client-session",
  characterId: "jung",
  judgeId: "socrates",
  themeId: "objective-truth",
  userPosition: "A favor: a verdade é objetiva?",
  createdAt: "2026-09-13T17:00:00.000Z",
});

afterEach(() => vi.unstubAllGlobals());

describe("AI browser client", () => {
  it("reads progressive UTF-8 text and returns the normalized turn", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("Primeira parte "));
        controller.enqueue(encoder.encode("e conclusão."));
        controller.close();
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200 })));
    const updates: string[] = [];

    const result = await streamCharacterTurn(session, (text) => updates.push(text));
    expect(updates).toEqual(["Primeira parte ", "Primeira parte e conclusão.", "Primeira parte e conclusão."]);
    expect(result).toBe("Primeira parte e conclusão.");
  });

  it("waits out an in-flight evaluation instead of failing", async () => {
    vi.useFakeTimers();
    const evaluation = { verdict: "draw" };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ error: "Esta etapa já está sendo processada.", code: "IN_FLIGHT" }, { status: 409 }),
      )
      .mockResolvedValueOnce(Response.json({ evaluation }));
    vi.stubGlobal("fetch", fetchMock);

    const pending = requestEvaluation(session);
    await vi.advanceTimersByTimeAsync(3_000);
    await expect(pending).resolves.toEqual(evaluation);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("gives up on a 409 that is not the in-flight guard", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ error: "O debate ainda não está pronto para avaliação." }, { status: 409 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestEvaluation(session)).rejects.toMatchObject({ status: 409 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("surfaces safe API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ error: "A chave do Gemini ainda não foi configurada no servidor." }, { status: 503 }),
      ),
    );

    await expect(streamCharacterTurn(session, () => undefined)).rejects.toMatchObject({
      status: 503,
      message: "A chave do Gemini ainda não foi configurada no servidor.",
    });
  });

  it("fails closed when a text stream breaks after partial output", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("Resposta parcial"));
        controller.error(new Error("provider details"));
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200 })));

    await expect(streamCharacterTurn(session, () => undefined)).rejects.toMatchObject({
      status: 502,
      message: "A transmissão foi interrompida antes do fim. Tente novamente.",
    });
  });

  it("rejects incomplete evaluation payloads", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ model: "test" })));
    await expect(requestEvaluation(session)).rejects.toThrow(/incompleta/);
  });
});
