/**
 * Strips thinking/reasoning blocks from LLM responses before they reach users.
 *
 * Thinking models (e.g. gemma4:e4b, deepseek-r1, qwq) emit chain-of-thought
 * reasoning wrapped in <think>...</think> or <thinking>...</thinking> tags.
 * Some models also emit raw English "Okay, let's see…" prose without tags.
 * Both forms must never appear in customer-facing messages.
 */

const THINK_OPEN_RE = /<think(?:ing)?>/i;
const THINK_CLOSE_RE = /<\/think(?:ing)?>/i;
const THINKING_BLOCK_RE = /<think(?:ing)?[\s\S]*?<\/think(?:ing)?>/gi;

/**
 * Patterns that indicate an untagged English reasoning prefix.
 * Checked only against the very start of the stream.
 */
const UNTAGGED_REASONING_PREFIXES = [
  /^okay[,\s]/i,
  /^let me/i,
  /^let's see/i,
  /^looking at/i,
  /^wait[,\s]/i,
  /^the user/i,
  /^alright[,\s]/i,
  /^so[,\s]the/i,
  /^hmm[,\s]/i,
];

/**
 * Vietnamese text contains Unicode diacritics not present in plain ASCII English.
 * A character is considered "Vietnamese-indicative" when it falls outside the
 * basic ASCII printable range (0x20–0x7E).
 */
const hasVietnameseDiacritic = (text: string): boolean => {
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 0x7e) return true;
  }
  return false;
};

/**
 * Strips all complete <think>...</think> and <thinking>...</thinking> blocks
 * from a complete text string. Safe to call on accumulated/complete LLM output.
 */
export const stripThinkingBlocks = (text: string): string =>
  text.replace(THINKING_BLOCK_RE, '').trim();

/**
 * Creates a stateful streaming filter that wraps an `onToken` callback.
 * Tokens inside <think> blocks are silently discarded; all other tokens
 * are forwarded to `onToken`.
 *
 * Also strips untagged English reasoning prefixes (e.g. "Okay, let's see…")
 * that some models output before the actual Vietnamese response.
 *
 * Handles tags split across multiple token boundaries by keeping a lookahead
 * buffer equal to the length of the longest opening tag minus 1.
 *
 * Usage:
 *   const filter = createStreamingThinkingFilter(onToken);
 *   // for each streamed chunk:
 *   filter.push(token);
 *   // after stream ends:
 *   filter.flush();
 */
export const createStreamingThinkingFilter = (onToken: (text: string) => void) => {
  // The longest open tag is <thinking> (9 chars); keep 8 chars as lookahead.
  const LOOKAHEAD = 9; // len("<thinking>") - 1

  let inThinkBlock = false;
  let buffer = '';

  // --- Untagged reasoning guard ---
  // Accumulate the very start of the stream to detect English reasoning prose.
  // Once we have enough chars (or found Vietnamese text), this mode ends.
  const REASONING_PROBE_LIMIT = 2000;
  let reasoningProbeActive = true; // true until we decide pass/discard
  let reasoningProbeBuf = '';
  let inUntaggedReasoning = false;

  const tryConsumeCloseTag = (): boolean => {
    const match = THINK_CLOSE_RE.exec(buffer);
    if (match) {
      // Discard everything up to and including the close tag
      buffer = buffer.slice(match.index + match[0].length);
      inThinkBlock = false;
      return true;
    }
    return false;
  };

  const tryConsumeOpenTag = (): boolean => {
    const match = THINK_OPEN_RE.exec(buffer);
    if (match === null) return false;

    // Emit everything before the open tag
    const before = buffer.slice(0, match.index);
    if (before) onToken(before);

    // Discard the open tag itself, enter thinking state
    buffer = buffer.slice(match.index + match[0].length);
    inThinkBlock = true;
    return true;
  };

  /**
   * Untagged-reasoning guard.
   * Returns the token to forward (possibly empty string if still probing/discarding).
   */
  const applyReasoningGuard = (token: string): string => {
    if (!reasoningProbeActive && !inUntaggedReasoning) return token;

    if (reasoningProbeActive) {
      reasoningProbeBuf += token;

      // Vietnamese diacritic detected → this is a real response, not reasoning
      if (hasVietnameseDiacritic(reasoningProbeBuf)) {
        reasoningProbeActive = false;
        inUntaggedReasoning = false;
        const out = reasoningProbeBuf;
        reasoningProbeBuf = '';
        return out;
      }

      // Check if start matches a known English reasoning prefix
      const trimmed = reasoningProbeBuf.trimStart();
      const looksLikeReasoning = UNTAGGED_REASONING_PREFIXES.some((re) => re.test(trimmed));

      if (looksLikeReasoning) {
        // Enter discard mode — keep buffering, waiting for Vietnamese
        inUntaggedReasoning = true;
      }

      if (inUntaggedReasoning) {
        // Still in English reasoning — look for start of Vietnamese response.
        // A paragraph break followed by Vietnamese diacritics is the signal.
        const breakIdx = reasoningProbeBuf.search(/\n\n|\n(?=[^\n])/);
        if (breakIdx !== -1) {
          const after = reasoningProbeBuf.slice(breakIdx).trimStart();
          if (hasVietnameseDiacritic(after)) {
            reasoningProbeActive = false;
            inUntaggedReasoning = false;
            reasoningProbeBuf = '';
            return after;
          }
        }

        // Still no Vietnamese after the probe limit — give up and emit nothing
        if (reasoningProbeBuf.length >= REASONING_PROBE_LIMIT) {
          reasoningProbeActive = false;
          inUntaggedReasoning = false;
          reasoningProbeBuf = '';
          return '';
        }

        return ''; // still buffering
      }

      // Non-reasoning ASCII text (e.g. a product name) — stop probing & emit
      if (reasoningProbeBuf.length >= REASONING_PROBE_LIMIT) {
        reasoningProbeActive = false;
        const out = reasoningProbeBuf;
        reasoningProbeBuf = '';
        return out;
      }

      return ''; // still collecting initial chars
    }

    return token;
  };

  const push = (token: string): void => {
    const guardedToken = applyReasoningGuard(token);
    if (!guardedToken) return;

    buffer += guardedToken;

    if (inThinkBlock) {
      // Keep consuming close tags until none remain
      while (inThinkBlock && tryConsumeCloseTag()) {
        // After exiting think block, process remaining buffer content
        if (!inThinkBlock) {
          processContentBuffer();
        }
      }

      if (inThinkBlock) {
        // No close tag found yet; discard all but the last LOOKAHEAD chars
        // (they might be the start of a closing tag split across chunks)
        if (buffer.length > LOOKAHEAD) {
          buffer = buffer.slice(buffer.length - LOOKAHEAD);
        }
      }
    } else {
      processContentBuffer();
    }
  };

  const processContentBuffer = (): void => {
    // Keep consuming open tags, emitting the content before each one
    while (!inThinkBlock && tryConsumeOpenTag()) {
      // If we just entered a think block, handle any close tags immediately
      if (inThinkBlock) {
        while (inThinkBlock && tryConsumeCloseTag()) {
          // Exited think block; loop continues to check for more open tags
        }
      }
    }

    if (!inThinkBlock) {
      // Safe to emit all but the last LOOKAHEAD chars (partial tag guard)
      if (buffer.length > LOOKAHEAD) {
        const safeEnd = buffer.length - LOOKAHEAD;
        onToken(buffer.slice(0, safeEnd));
        buffer = buffer.slice(safeEnd);
      }
    }
  };

  const flush = (): void => {
    // If we ended while still in the reasoning guard with non-reasoning text, emit it
    if (reasoningProbeActive && reasoningProbeBuf && !inUntaggedReasoning) {
      const safe = reasoningProbeBuf.replace(THINKING_BLOCK_RE, '');
      if (safe) onToken(safe);
    }
    reasoningProbeActive = false;
    inUntaggedReasoning = false;
    reasoningProbeBuf = '';

    if (!inThinkBlock && buffer) {
      // Emit any remaining buffered content that is not inside a think block
      const remaining = buffer.replace(THINKING_BLOCK_RE, '');
      if (remaining) onToken(remaining);
    }
    buffer = '';
    inThinkBlock = false;
  };

  return { push, flush };
};
