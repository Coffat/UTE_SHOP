import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAlternateProviderRuntimes,
  buildProviderAttemptChain,
} from '../modules/ai/providers/providerCrossFallback.service.js';
import type { EffectiveAiRuntime } from '../modules/ai/types/ai.types.js';

const ollamaRuntime: EffectiveAiRuntime = {
  provider: 'ollama',
  modelId: 'gemma4:e4b',
  runtimeSource: 'store_settings',
  requestTimeoutMs: 45_000,
  maxPredictTokens: 500,
  temperature: 0.4,
  toolDecisionMaxPredictTokens: 180,
  toolDecisionTemperature: 0.1,
};

describe('providerCrossFallback', () => {
  it('offers openrouter alternate when primary is ollama and API key exists', () => {
    const original = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = 'test-key';
    try {
      const alternates = buildAlternateProviderRuntimes(ollamaRuntime);
      assert.ok(alternates.some((item) => item.provider === 'openrouter'));
    } finally {
      if (original === undefined) delete process.env.OPENROUTER_API_KEY;
      else process.env.OPENROUTER_API_KEY = original;
    }
  });

  it('chains primary before alternates', () => {
    const chain = buildProviderAttemptChain(ollamaRuntime);
    assert.equal(chain[0]?.provider, 'ollama');
    assert.ok(chain.length >= 1);
  });
});
