import { checkMetricRateLimit } from "@/ai/guard";
import { jsonError, readJsonBody, requestErrorResponse } from "@/ai/http";
import { characterIdSchema, judgeIdSchema, opaqueIdSchema, themeIdSchema } from "@/ai/schemas";
import { z } from "zod";

const productEventSchema = z.discriminatedUnion("event", [
  z.object({
    event: z.enum(["debate_started", "debate_completed"]),
    sessionId: opaqueIdSchema,
    characterId: characterIdSchema,
    judgeId: judgeIdSchema,
    themeId: themeIdSchema,
  }),
  z.object({
    event: z.literal("feedback_submitted"),
    sessionId: opaqueIdSchema,
    value: z.enum(["yes", "no"]),
  }),
]);

export async function POST(request: Request): Promise<Response> {
  try {
    checkMetricRateLimit(request);
    const payload = productEventSchema.parse(await readJsonBody(request, 2_000));
    console.info("Product metric", payload);
    return new Response(null, { status: 204 });
  } catch (error) {
    const response = requestErrorResponse(error);
    return response.status === 400
      ? jsonError("O evento informado é inválido.", 400)
      : response;
  }
}
