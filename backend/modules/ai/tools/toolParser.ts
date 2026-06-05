import { toolCallProtocolSchema } from './toolSchemas.js';
import type { ParsedPass1Decision } from './tool.types.js';

const tryParseJson = (raw: string): unknown | null => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const extractFirstJsonObject = (raw: string): string | null => {
  const text = raw.trim();
  const firstBraceIndex = text.indexOf('{');
  if (firstBraceIndex < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = firstBraceIndex; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') {
      depth += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(firstBraceIndex, i + 1);
      }
    }
  }

  return null;
};

export const parsePass1Decision = (rawText: string): ParsedPass1Decision => {
  const strictPayload = tryParseJson(rawText.trim());
  if (strictPayload != null) {
    const strictResult = toolCallProtocolSchema.safeParse(strictPayload);
    if (strictResult.success) {
      return {
        ok: true,
        strategy: 'strict_json',
        decision: strictResult.data,
        error: null,
        rawText,
      };
    }
    return {
      ok: false,
      strategy: 'strict_json',
      decision: null,
      error: strictResult.error.issues[0]?.message ?? 'Invalid tool protocol payload.',
      rawText,
    };
  }

  const firstObject = extractFirstJsonObject(rawText);
  if (firstObject) {
    const extractedPayload = tryParseJson(firstObject);
    if (extractedPayload != null) {
      const extractedResult = toolCallProtocolSchema.safeParse(extractedPayload);
      if (extractedResult.success) {
        return {
          ok: true,
          strategy: 'first_object',
          decision: extractedResult.data,
          error: null,
          rawText,
        };
      }
      return {
        ok: false,
        strategy: 'first_object',
        decision: null,
        error: extractedResult.error.issues[0]?.message ?? 'Invalid extracted tool payload.',
        rawText,
      };
    }
  }

  return {
    ok: false,
    strategy: 'invalid',
    decision: null,
    error: 'No valid JSON tool protocol payload found.',
    rawText,
  };
};
