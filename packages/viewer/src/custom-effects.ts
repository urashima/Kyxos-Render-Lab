import * as THREE from 'three/webgpu';
import {
  Fn,
  color,
  convertToTexture,
  dot,
  float,
  mix,
  screenUV,
  sin,
  texture3D,
  uniform,
  uv,
  vec2,
  vec3,
  vec4
} from 'three/tsl';
import { lut3D } from 'three/addons/tsl/display/Lut3DNode.js';

export function createLensDistortion(inputNode: any, strengthNode: any): any {
  const source = convertToTexture(inputNode);
  return Fn(() => {
    const centered = uv().sub(0.5);
    const radiusSquared = dot(centered, centered);
    const warpedUv = centered.mul(float(1).add(radiusSquared.mul(strengthNode))).add(0.5);
    return source.sample(warpedUv.clamp(0, 1));
  })();
}

export function createSparkle(
  inputNode: any,
  metalRoughNode: any,
  intensityNode: any,
  thresholdNode: any,
  scaleNode: any
): any {
  const source = convertToTexture(inputNode);
  return Fn(() => {
    const sourceColor = source.sample(uv());
    const seed = dot(uv().mul(scaleNode), vec2(12.9898, 78.233));
    const noise = sin(seed).mul(43758.5453).fract();
    const sparkle = noise.smoothstep(thresholdNode, 1);
    const materialMask = metalRoughNode.r.mul(metalRoughNode.g.oneMinus()).saturate();
    const energy = sparkle.mul(materialMask).mul(intensityNode);
    return vec4(sourceColor.rgb.add(vec3(energy)), sourceColor.a);
  })();
}

export function createGradientBackground(top = 0x20252f, bottom = 0x05070b): any {
  return mix(color(bottom), color(top), screenUV.y.smoothstep(0, 1));
}

export function createNeutralLutTexture(): any {
  const size = 2;
  const data = new Uint8Array(size * size * size * 4);
  let offset = 0;
  for (let z = 0; z < size; z += 1) {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        data[offset++] = x * 255;
        data[offset++] = y * 255;
        data[offset++] = z * 255;
        data[offset++] = 255;
      }
    }
  }
  const texture = new THREE.Data3DTexture(data, size, size, size);
  texture.format = THREE.RGBAFormat;
  texture.type = THREE.UnsignedByteType;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  texture.name = 'Kyxos.NeutralLUT';
  return texture;
}

export function applyNeutralLut(inputNode: any, lutTexture: any, intensity: number): any {
  return lut3D(inputNode, texture3D(lutTexture), lutTexture.image.width, uniform(intensity));
}
