import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  stripThinkingBlocks,
  createStreamingThinkingFilter,
} from '../modules/ai/utils/aiThinkingFilter.js';

describe('stripThinkingBlocks', () => {
  it('removes a complete <think> block', () => {
    const input = '<think>internal reasoning here</think>Dạ, mình giúp được bạn.';
    assert.equal(stripThinkingBlocks(input), 'Dạ, mình giúp được bạn.');
  });

  it('removes a complete <thinking> block', () => {
    const input = '<thinking>chain of thought</thinking>Xin chào!';
    assert.equal(stripThinkingBlocks(input), 'Xin chào!');
  });

  it('removes multiple think blocks', () => {
    const input = '<think>step 1</think>text1<think>step 2</think>text2';
    assert.equal(stripThinkingBlocks(input), 'text1text2');
  });

  it('returns unchanged text when no think blocks present', () => {
    const input = 'Dạ, shop mở cửa từ 08:00 đến 21:00.';
    assert.equal(stripThinkingBlocks(input), input);
  });

  it('handles multiline think blocks', () => {
    const input = '<think>\nLine one\nLine two\n</think>Final answer.';
    assert.equal(stripThinkingBlocks(input), 'Final answer.');
  });

  it('handles empty input', () => {
    assert.equal(stripThinkingBlocks(''), '');
  });

  it('handles text that is only a think block', () => {
    const input = '<think>pure reasoning</think>';
    assert.equal(stripThinkingBlocks(input), '');
  });

  it('is case-insensitive for the tag name', () => {
    const input = '<THINK>uppercase tag</THINK>Content.';
    assert.equal(stripThinkingBlocks(input), 'Content.');
  });
});

describe('createStreamingThinkingFilter', () => {
  const collect = (tokens: string[]): { push: (t: string) => void; flush: () => void; result: () => string } => {
    const out: string[] = [];
    const filter = createStreamingThinkingFilter((t) => out.push(t));
    return {
      push: (t) => filter.push(t),
      flush: () => filter.flush(),
      result: () => out.join(''),
    };
  };

  it('passes through content with no think blocks', () => {
    const s = collect([]);
    s.push('Hello ');
    s.push('World');
    s.flush();
    assert.equal(s.result(), 'Hello World');
  });

  it('suppresses tokens inside a <think> block', () => {
    const s = collect([]);
    s.push('Before');
    s.push('<think>thinking...');
    s.push('more thinking');
    s.push('</think>');
    s.push('After');
    s.flush();
    assert.equal(s.result(), 'BeforeAfter');
  });

  it('handles <think> tag split across two tokens', () => {
    const s = collect([]);
    s.push('Start<thi');
    s.push('nk>hidden</think>End');
    s.flush();
    assert.equal(s.result(), 'StartEnd');
  });

  it('handles </think> closing tag split across tokens', () => {
    const s = collect([]);
    s.push('A<think>inside</thi');
    s.push('nk>B');
    s.flush();
    assert.equal(s.result(), 'AB');
  });

  it('handles multiple think blocks in stream', () => {
    const s = collect([]);
    s.push('<think>r1</think>text1<think>r2</think>text2');
    s.flush();
    assert.equal(s.result(), 'text1text2');
  });

  it('emits nothing when entire stream is inside think block', () => {
    const s = collect([]);
    s.push('<think>all reasoning here</think>');
    s.flush();
    assert.equal(s.result(), '');
  });

  it('handles empty flush after clean content', () => {
    const s = collect([]);
    s.push('Clean text');
    s.flush();
    assert.equal(s.result(), 'Clean text');
  });

  it('handles token-by-token stream with think block at start', () => {
    const chars = '<think>r</think>OK'.split('');
    const s = collect([]);
    for (const c of chars) s.push(c);
    s.flush();
    assert.equal(s.result(), 'OK');
  });
});
