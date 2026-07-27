import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const EFFECT_GRAPH_SOURCE = readFileSync(
  new URL('../packages/viewer/src/EffectGraph.ts', import.meta.url),
  'utf8'
);

describe('effect graph composition', () => {
  it('additively composites bloom over the scene instead of replacing scene color', () => {
    expect(EFFECT_GRAPH_SOURCE).toContain('const bloomInput = current;');
    expect(EFFECT_GRAPH_SOURCE).toContain('const bloomNode = bloom(');
    expect(EFFECT_GRAPH_SOURCE).toContain(
      'current = vec4(bloomInput.rgb.add(bloomNode.rgb), bloomInput.a);'
    );
    expect(EFFECT_GRAPH_SOURCE).not.toMatch(/current\s*=\s*bloom\s*\(/);
  });
});
