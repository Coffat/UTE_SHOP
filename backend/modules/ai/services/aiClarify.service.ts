import { z } from 'zod';
import { completeActiveProviderResponse } from '../providers/aiProvider.router.js';
import type { EffectiveAiRuntime } from '../types/ai.types.js';

/**
 * Pass3 system prompt — extremely short, single responsibility:
 * generate clarifying questions in Vietnamese.
 */
const PASS3_SYSTEM_PROMPT = `Bạn là trợ lý CSKH của UTESHOP (shop hoa tươi và quà tặng).
Khách vừa gửi tin nhắn nhưng ý định chưa rõ.
Sinh đúng 2–3 câu hỏi ngắn (tiếng Việt) để làm rõ nhu cầu của khách.
Mỗi câu hỏi tối đa 60 ký tự, tự nhiên, thân thiện.
CHỈ trả về JSON hợp lệ, không có text thừa:
{"questions":["...","...","..."]}`;

/**
 * Zod schema for Pass3 output validation.
 * Ensures the LLM returned a valid, safe structure before persisting.
 */
const Pass3Schema = z.object({
  questions: z
    .array(z.string().min(5).max(80))
    .min(1)
    .max(3),
});

export type Pass3Result = z.infer<typeof Pass3Schema>;

/**
 * Attempt to parse raw LLM text into a validated Pass3Result.
 * Returns null if the text is not valid JSON or fails schema validation.
 */
const parsePass3Output = (rawText: string): Pass3Result | null => {
  try {
    // Strip potential markdown code fences (```json ... ```)
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    const parsed = Pass3Schema.safeParse(JSON.parse(cleaned));
    if (!parsed.success) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

/**
 * Pass3: generate clarifying questions after Pass2 streaming completes.
 *
 * This is a non-critical, fire-after-stream step.
 * Any failure (LLM error, parse error, timeout) returns null gracefully —
 * the main AI response is never affected.
 *
 * @param runtime - The active AI runtime (same as Pass2 for provider consistency)
 * @param customerMessage - The original ambiguous customer message
 * @param signal - Optional AbortSignal inherited from the parent stream request
 * @returns Array of 1–3 Vietnamese clarifying question strings, or null on any failure
 */
export const generateClarifyingQuestions = async (
  runtime: EffectiveAiRuntime,
  customerMessage: string,
  signal?: AbortSignal,
): Promise<string[] | null> => {
  try {
    const result = await completeActiveProviderResponse(
      runtime,
      [
        { role: 'system', content: PASS3_SYSTEM_PROMPT },
        { role: 'user', content: customerMessage.slice(0, 300) }, // safety cap
      ],
      {
        temperature: 0.4,
        maxPredictTokens: 150,
        signal,
      },
    );

    const validated = parsePass3Output(result.fullText);
    if (!validated) return null;

    // Extra safety: deduplicate and strip empty strings
    const unique = [...new Set(validated.questions.map((q) => q.trim()).filter(Boolean))];
    return unique.length > 0 ? unique : null;
  } catch {
    // Pass3 failure is always non-critical — swallow silently
    return null;
  }
};
