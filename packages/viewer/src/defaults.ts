import type { EffectName, EffectSettings, QualityPreset } from './types.js';

export const EFFECT_DEFAULTS: Record<EffectName, EffectSettings> = {
  fxaa: { enabled: false },
  smaa: { enabled: false },
  ssaa: { enabled: false, sampleLevel: 3 },
  traa: {
    enabled: true,
    depthThreshold: 0.0005,
    edgeDepthDiff: 0.001,
    maxVelocityLength: 128,
    useSubpixelCorrection: true
  },
  temporal: { enabled: false, maxFrames: 32, clampIntensity: 1 },
  gtao: {
    enabled: true,
    radius: 0.25,
    scale: 1,
    thickness: 1,
    samples: 16,
    resolutionScale: 1,
    useTemporalFiltering: true
  },
  ssao: {
    enabled: false,
    radius: 0.5,
    intensity: 1,
    bias: 0.025,
    samples: 16,
    resolutionScale: 0.5,
    blurEnabled: true,
    blurSharpness: 2
  },
  ssr: {
    enabled: true,
    quality: 0.5,
    blurQuality: 1,
    maxDistance: 1,
    intensity: 1,
    thickness: 0.03,
    resolutionScale: 0.5
  },
  ssgi: {
    enabled: true,
    sliceCount: 2,
    stepCount: 8,
    radius: 10,
    thickness: 1,
    aoIntensity: 1,
    giIntensity: 1,
    useTemporalFiltering: true
  },
  denoise: { enabled: false, radius: 5, lumaPhi: 5, depthPhi: 5, normalPhi: 5 },
  temporalDenoise: { enabled: true },
  motionBlur: { enabled: false, samples: 16 },
  bloom: { enabled: true, strength: 0.25, radius: 0.25, threshold: 1 },
  dof: { enabled: false, focusDistance: 4, focalLength: 0.04, bokehScale: 1.5 },
  lut: { enabled: true, intensity: 0.35 },
  lensDistortion: { enabled: false, strength: 0.035 },
  sharpness: { enabled: true, sharpness: 1.2, denoise: true },
  sparkle: { enabled: false, intensity: 0.08, threshold: 0.985, scale: 720 },
  background: { enabled: true, top: 0x20252f, bottom: 0x05070b }
};

export const QUALITY_PRESETS: Record<QualityPreset, Partial<Record<EffectName, EffectSettings>>> = {
  low: {
    fxaa: { enabled: true },
    smaa: { enabled: false },
    ssaa: { enabled: false },
    traa: { enabled: false },
    gtao: { enabled: true, resolutionScale: 0.5, samples: 8 },
    ssao: { enabled: false },
    ssr: { enabled: false },
    ssgi: { enabled: false },
    motionBlur: { enabled: false },
    bloom: { enabled: false },
    dof: { enabled: false },
    temporalDenoise: { enabled: false }
  },
  medium: {
    fxaa: { enabled: false },
    smaa: { enabled: false },
    ssaa: { enabled: false },
    traa: { enabled: true },
    gtao: { enabled: true, resolutionScale: 0.5, samples: 12 },
    ssr: { enabled: true, resolutionScale: 0.5, quality: 0.35 },
    ssgi: { enabled: false },
    bloom: { enabled: true },
    motionBlur: { enabled: false },
    temporalDenoise: { enabled: false }
  },
  high: {
    fxaa: { enabled: false },
    smaa: { enabled: false },
    ssaa: { enabled: false },
    traa: { enabled: true },
    gtao: { enabled: true, resolutionScale: 1, samples: 16 },
    ssr: { enabled: true, resolutionScale: 0.75, quality: 0.5 },
    ssgi: { enabled: true, sliceCount: 2, stepCount: 8 },
    temporalDenoise: { enabled: true },
    bloom: { enabled: true },
    lut: { enabled: true },
    motionBlur: { enabled: false },
    dof: { enabled: false },
    lensDistortion: { enabled: false }
  },
  cinematic: {
    fxaa: { enabled: false },
    smaa: { enabled: false },
    ssaa: { enabled: false },
    traa: { enabled: true },
    gtao: { enabled: true, resolutionScale: 1, samples: 24 },
    ssr: { enabled: true, resolutionScale: 1, quality: 0.75, blurQuality: 2 },
    ssgi: { enabled: true, sliceCount: 4, stepCount: 16 },
    temporalDenoise: { enabled: true },
    motionBlur: { enabled: true, samples: 20 },
    bloom: { enabled: true, strength: 0.35 },
    dof: { enabled: true },
    lut: { enabled: true, intensity: 0.5 },
    lensDistortion: { enabled: true, strength: 0.025 }
  },
  capture: {
    fxaa: { enabled: false },
    smaa: { enabled: false },
    traa: { enabled: false },
    ssaa: { enabled: true, sampleLevel: 4 },
    gtao: { enabled: true, resolutionScale: 1, samples: 32 },
    ssr: { enabled: true, resolutionScale: 1, quality: 1, blurQuality: 3 },
    ssgi: { enabled: true, sliceCount: 4, stepCount: 24 },
    temporalDenoise: { enabled: true },
    motionBlur: { enabled: false },
    bloom: { enabled: true },
    dof: { enabled: false },
    lut: { enabled: true },
    lensDistortion: { enabled: false }
  }
};

export function cloneEffectDefaults(): Record<EffectName, EffectSettings> {
  return structuredClone(EFFECT_DEFAULTS);
}
