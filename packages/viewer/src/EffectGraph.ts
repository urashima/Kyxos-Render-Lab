import * as THREE from 'three/webgpu';
import {
  add,
  convertToTexture,
  diffuseColor,
  directionToColor,
  emissive,
  int,
  metalness,
  mrt,
  normalView,
  output,
  pass,
  renderOutput,
  roughness,
  uniform,
  vec2,
  vec3,
  vec4,
  velocity
} from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { denoise } from 'three/addons/tsl/display/DenoiseNode.js';
import { dof } from 'three/addons/tsl/display/DepthOfFieldNode.js';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { motionBlur } from 'three/addons/tsl/display/MotionBlur.js';
import { recurrentDenoise } from 'three/addons/tsl/display/RecurrentDenoiseNode.js';
import { sharpen } from 'three/addons/tsl/display/SharpenNode.js';
import { smaa } from 'three/addons/tsl/display/SMAANode.js';
import { ssaaPass } from 'three/addons/tsl/display/SSAAPassNode.js';
import { ssao } from 'three/addons/tsl/display/SSAONode.js';
import { ssgi } from 'three/addons/tsl/display/SSGINode.js';
import { ssr } from 'three/addons/tsl/display/SSRNode.js';
import { temporalReproject } from 'three/addons/tsl/display/TemporalReprojectNode.js';
import { traa } from 'three/addons/tsl/display/TRAANode.js';
import {
  applyNeutralLut,
  createGradientBackground,
  createLensDistortion,
  createNeutralLutTexture,
  createSparkle
} from './custom-effects.js';
import type { DebugBuffer, EffectName, EffectSettings } from './types.js';

export class EffectGraph {
  private readonly renderer: any;
  private readonly scene: any;
  private readonly camera: any;
  private readonly pipeline: any;
  private readonly lutTexture: any;
  private disposables: any[] = [];
  private bufferNodes = new Map<DebugBuffer, any>();
  private activeDebugBuffer: DebugBuffer = 'beauty';

  constructor(renderer: any, scene: any, camera: any) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.pipeline = new THREE.RenderPipeline(renderer);
    this.pipeline.outputColorTransform = false;
    this.lutTexture = createNeutralLutTexture();
    this.scene.backgroundNode = createGradientBackground();
  }

  rebuild(effects: Record<EffectName, EffectSettings>, debugBuffer: DebugBuffer): void {
    this.disposeGraph();
    this.activeDebugBuffer = debugBuffer;

    const scenePass = pass(this.scene, this.camera);
    scenePass.setMRT(
      mrt({
        output,
        normal: normalView,
        diffuseColor,
        metalrough: vec2(metalness, roughness),
        emissive,
        velocity
      })
    );
    this.track(scenePass);

    const beauty = scenePass.getTextureNode('output');
    const depth = scenePass.getTextureNode('depth');
    const normal = scenePass.getTextureNode('normal');
    const diffuse = scenePass.getTextureNode('diffuseColor');
    const metalRough = scenePass.getTextureNode('metalrough');
    const emissiveNode = scenePass.getTextureNode('emissive');
    const velocityNode = scenePass.getTextureNode('velocity');

    this.bufferNodes.set('beauty', beauty);
    this.bufferNodes.set('depth', vec4(vec3(scenePass.getLinearDepthNode()), 1));
    this.bufferNodes.set('velocity', vec4(velocityNode.xy.mul(0.5).add(0.5), 0, 1));
    this.bufferNodes.set('normal', vec4(directionToColor(normal.rgb.normalize()), 1));
    this.bufferNodes.set('diffuseColor', diffuse);
    this.bufferNodes.set('metalness', vec4(vec3(metalRough.r), 1));
    this.bufferNodes.set('roughness', vec4(vec3(metalRough.g), 1));
    this.bufferNodes.set('emissive', vec4(emissiveNode.rgb, 1));

    if (debugBuffer !== 'beauty') {
      this.pipeline.outputNode = renderOutput(this.bufferNodes.get(debugBuffer));
      this.pipeline.needsUpdate = true;
      return;
    }

    let current: any = beauty;

    if (effects.ssaa.enabled) {
      const ssaaNode = ssaaPass(this.scene, this.camera);
      ssaaNode.sampleLevel = Number(effects.ssaa.sampleLevel ?? 3);
      this.track(ssaaNode);
      current = ssaaNode.getTextureNode();
    }

    if (effects.gtao.enabled) {
      const gtaoNode = ao(depth, normal, this.camera);
      this.applyNodeSettings(gtaoNode, effects.gtao);
      this.track(gtaoNode);
      current = current.mul(vec4(vec3(gtaoNode.getTextureNode().r), 1));
    }

    if (effects.ssao.enabled) {
      const ssaoNode = ssao(depth, normal, this.camera);
      this.applyNodeSettings(ssaoNode, effects.ssao);
      this.track(ssaoNode);
      current = current.mul(vec4(vec3(ssaoNode.getTextureNode().r), 1));
    }

    if (effects.ssgi.enabled) {
      const giNode = ssgi(convertToTexture(current), depth, normal, this.camera);
      this.applyNodeSettings(giNode, effects.ssgi);
      this.track(giNode);
      const gi = giNode.rgb;
      const occlusion = giNode.a;
      current = vec4(add(current.rgb.mul(occlusion), diffuse.rgb.mul(gi)), current.a);
    }

    if (effects.ssr.enabled) {
      const reflection = ssr(
        convertToTexture(current),
        depth,
        normal,
        metalRough.r,
        metalRough.g,
        this.camera
      );
      this.applyNodeSettings(reflection, effects.ssr);
      this.track(reflection);
      current = vec4(current.rgb.add(reflection.rgb), current.a);
    }

    if (effects.sparkle.enabled) {
      current = createSparkle(
        current,
        metalRough,
        uniform(Number(effects.sparkle.intensity ?? 0.08)),
        uniform(Number(effects.sparkle.threshold ?? 0.985)),
        uniform(Number(effects.sparkle.scale ?? 720))
      );
    }

    if (effects.temporal.enabled) {
      const temporalNode = temporalReproject(
        convertToTexture(current),
        depth,
        normal,
        velocityNode,
        this.camera
      );
      this.applyNodeSettings(temporalNode, effects.temporal);
      this.track(temporalNode);
      current = temporalNode;
    }

    if (effects.denoise.enabled) {
      const denoiseNode = denoise(convertToTexture(current), depth, normal, this.camera);
      this.applyNodeSettings(denoiseNode, effects.denoise);
      this.track(denoiseNode);
      current = denoiseNode;
    }

    if (effects.traa.enabled) {
      const traaNode = traa(convertToTexture(current), depth, velocityNode, this.camera);
      this.applyNodeSettings(traaNode, effects.traa);
      this.track(traaNode);
      current = traaNode;
    }

    if (effects.temporalDenoise.enabled) {
      const recurrentNode = recurrentDenoise(convertToTexture(current), this.camera, {
        depth,
        normal,
        metalRoughness: metalRough,
        diffuse,
        raw: convertToTexture(current),
        mode: 'diffuse',
        accumulate: true
      });
      this.track(recurrentNode);
      current = recurrentNode;
    }

    if (effects.motionBlur.enabled) {
      current = motionBlur(
        convertToTexture(current),
        velocityNode,
        int(Number(effects.motionBlur.samples ?? 16))
      );
    }

    if (effects.bloom.enabled) {
      current = bloom(
        convertToTexture(current),
        Number(effects.bloom.strength ?? 0.25),
        Number(effects.bloom.radius ?? 0.25),
        Number(effects.bloom.threshold ?? 1)
      );
      this.track(current);
    }

    if (effects.dof.enabled) {
      current = dof(
        convertToTexture(current),
        scenePass.getViewZNode(),
        uniform(Number(effects.dof.focusDistance ?? 4)),
        uniform(Number(effects.dof.focalLength ?? 0.04)),
        uniform(Number(effects.dof.bokehScale ?? 1.5))
      );
      this.track(current);
    }

    current = renderOutput(current);

    if (effects.lut.enabled) {
      current = applyNeutralLut(current, this.lutTexture, Number(effects.lut.intensity ?? 0.35));
      this.track(current);
    }

    if (effects.lensDistortion.enabled) {
      current = createLensDistortion(
        current,
        uniform(Number(effects.lensDistortion.strength ?? 0.035))
      );
    }

    if (effects.sharpness.enabled) {
      current = sharpen(
        convertToTexture(current),
        uniform(Number(effects.sharpness.sharpness ?? 1.2)),
        Boolean(effects.sharpness.denoise)
      );
      this.track(current);
    }

    if (effects.fxaa.enabled) current = fxaa(convertToTexture(current));
    if (effects.smaa.enabled) current = smaa(convertToTexture(current));

    this.pipeline.outputNode = current;
    this.pipeline.needsUpdate = true;
  }

  render(): void {
    this.pipeline.render();
  }

  getRenderTargetEstimate(): number {
    return 8 + this.disposables.length;
  }

  setGradientBackground(top: number, bottom: number): void {
    this.scene.backgroundNode = createGradientBackground(top, bottom);
    this.pipeline.needsUpdate = true;
  }

  dispose(): void {
    this.disposeGraph();
    this.lutTexture.dispose();
    this.pipeline.dispose?.();
  }

  private track<T>(node: T): T {
    if (node && typeof (node as any).dispose === 'function') this.disposables.push(node);
    return node;
  }

  private applyNodeSettings(node: any, settings: EffectSettings): void {
    for (const [key, value] of Object.entries(settings)) {
      if (key === 'enabled' || value === undefined) continue;
      const target = node[key];
      if (target && typeof target === 'object' && 'value' in target) target.value = value;
      else if (key in node) node[key] = value;
    }
  }

  private disposeGraph(): void {
    const unique = [...new Set(this.disposables)].reverse();
    for (const item of unique) item.dispose?.();
    this.disposables = [];
    this.bufferNodes.clear();
  }
}
