export type BackendPreference = 'auto' | 'webgpu' | 'webgl2';
export type QualityPreset = 'low' | 'medium' | 'high' | 'cinematic' | 'capture';
export type DebugBuffer =
  | 'beauty'
  | 'depth'
  | 'velocity'
  | 'normal'
  | 'diffuseColor'
  | 'metalness'
  | 'roughness'
  | 'emissive';

export type EffectName =
  | 'fxaa'
  | 'smaa'
  | 'ssaa'
  | 'traa'
  | 'temporal'
  | 'gtao'
  | 'ssao'
  | 'ssr'
  | 'ssgi'
  | 'denoise'
  | 'temporalDenoise'
  | 'motionBlur'
  | 'bloom'
  | 'dof'
  | 'lut'
  | 'lensDistortion'
  | 'sharpness'
  | 'sparkle'
  | 'background';

export interface EffectSettings {
  enabled: boolean;
  [key: string]: boolean | number | string | undefined;
}

export interface MaterialTextureUrls {
  baseColor?: string;
  normal?: string;
  roughness?: string;
  metalness?: string;
  ambientOcclusion?: string;
  emissive?: string;
}

export interface KyxosViewerOptions {
  canvas: HTMLCanvasElement;
  backend?: BackendPreference;
  quality?: QualityPreset;
  pixelRatio?: number;
  autoStart?: boolean;
}

export interface ViewerMetrics {
  backend: 'webgpu' | 'webgl2' | 'unknown';
  fps: number;
  cpuFrameTimeMs: number;
  gpuFrameTimeMs: number | null;
  drawCalls: number;
  triangles: number;
  textures: number;
  renderTargets: number;
  quality: QualityPreset;
  debugBuffer: DebugBuffer;
}

export interface CaptureOptions {
  width?: number;
  height?: number;
  mimeType?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
}
