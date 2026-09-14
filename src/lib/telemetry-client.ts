import type { CharacterId, JudgeId, ThemeId } from "@/domain";

type ProductEvent =
  | {
      event: "debate_started" | "debate_completed";
      sessionId: string;
      characterId: CharacterId;
      judgeId: JudgeId;
      themeId: ThemeId;
    }
  | {
      event: "feedback_submitted";
      sessionId: string;
      value: "yes" | "no";
    };

export function trackProductEvent(payload: ProductEvent): void {
  void fetch("/api/metrics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Metrics are best effort and must never interrupt a debate.
  });
}
