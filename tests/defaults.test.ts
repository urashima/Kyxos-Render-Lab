import { describe, expect, it } from 'vitest';
import { EFFECT_DEFAULTS, QUALITY_PRESETS } from '../packages/viewer/src/defaults.js';
import type { EffectName, QualityPreset } from '../packages/viewer/src/types.js';

const PRESETS: QualityPreset[] = ['low', 'medium', 'high', 'cinematic', 'capture'];
const AA: EffectName[] = ['fxaa', 'smaa', 'ssaa', 'traa'];

describe('quality presets', () => {
  it('defines all five fixed quality levels', () => {
    expect(Object.keys(QUALITY_PRESETS).sort()).toEqual([...PRESETS].sort());
  });

  it.each(PRESETS)('%s enables at most one anti-aliasing mode', (preset) => {
    const settings = structuredClone(EFFECT_DEFAULTS);
    for (const [name, override] of Object.entries(QUALITY_PRESETS[preset])) {
      settings[name as EffectName] = { ...settings[name as EffectName], ...override };
    }
    expect(AA.filter((name) => settings[name].enabled)).toHaveLength(1);
  });

  it('capture uses SSAA and full-resolution screen-space effects', () => {
    expect(QUALITY_PRESETS.capture.ssaa?.enabled).toBe(true);
    expect(QUALITY_PRESETS.capture.traa?.enabled).toBe(false);
    expect(QUALITY_PRESETS.capture.gtao?.resolutionScale).toBe(1);
    expect(QUALITY_PRESETS.capture.ssr?.resolutionScale).toBe(1);
  });
});
