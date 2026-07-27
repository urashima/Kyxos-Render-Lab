import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { EffectGraph } from './EffectGraph.js';
import { cloneEffectDefaults, QUALITY_PRESETS } from './defaults.js';
import { canvasToBlob, disposeObject, fitObjectToView } from './resources.js';
import type {
  CaptureOptions,
  DebugBuffer,
  EffectName,
  EffectSettings,
  KyxosViewerOptions,
  MaterialTextureUrls,
  QualityPreset,
  ViewerMetrics
} from './types.js';

export class KyxosViewer {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: any;
  private readonly scene: any;
  private readonly camera: any;
  private readonly controls: any;
  private readonly graph: EffectGraph;
  private readonly effects: Record<EffectName, EffectSettings>;
  private quality: QualityPreset;
  private debugBuffer: DebugBuffer = 'beauty';
  private modelRoot: any = null;
  private environmentSource: any = null;
  private environmentTarget: any = null;
  private materialTextures: any[] = [];
  private disposed = false;
  private running = false;
  private autoRotate = false;
  private frameStart = 0;
  private fpsWindowStart = performance.now();
  private fpsFrames = 0;
  private fps = 0;
  private cpuFrameTime = 0;
  private backend: 'webgpu' | 'webgl2' | 'unknown' = 'unknown';
  private resizeObserver: ResizeObserver | null = null;

  private constructor(options: KyxosViewerOptions, renderer: any) {
    this.canvas = options.canvas;
    this.renderer = renderer;
    this.quality = options.quality ?? 'high';
    this.effects = cloneEffectDefaults();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.01, 1000);
    this.camera.position.set(2.8, 1.8, 3.8);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.target.set(0, 0.25, 0);
    this.controls.update();

    this.createLighting();
    this.modelRoot = this.createDefaultModel();
    this.scene.add(this.modelRoot);

    this.graph = new EffectGraph(this.renderer, this.scene, this.camera);
    this.setQualityPreset(this.quality);
    this.observeResize();
  }

  static async create(options: KyxosViewerOptions): Promise<KyxosViewer> {
    const preference = options.backend ?? 'auto';
    if (preference === 'webgpu' && !('gpu' in navigator)) {
      throw new Error('WebGPU was explicitly requested but navigator.gpu is unavailable.');
    }

    const renderer = new THREE.WebGPURenderer({
      canvas: options.canvas,
      antialias: false,
      alpha: false,
      forceWebGL: preference === 'webgl2'
    });
    renderer.setPixelRatio(Math.min(options.pixelRatio ?? window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    await renderer.init();

    const viewer = new KyxosViewer(options, renderer);
    viewer.backend = renderer.backend?.isWebGPUBackend ? 'webgpu' : 'webgl2';
    await viewer.installDefaultEnvironment();
    viewer.resize();
    if (options.autoStart !== false) viewer.start();
    return viewer;
  }

  async loadModel(url: string): Promise<void> {
    this.assertAlive();
    const gltf = await new GLTFLoader().loadAsync(url);
    const nextRoot = gltf.scene;
    nextRoot.traverse((object: any) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (material) material.side = THREE.FrontSide;
      }
    });
    disposeObject(this.modelRoot);
    this.modelRoot = nextRoot;
    this.scene.add(this.modelRoot);
    fitObjectToView(this.modelRoot, this.camera, this.controls);
    this.resetTemporal('model-change');
  }

  async loadEnvironment(url: string): Promise<void> {
    this.assertAlive();
    const lower = url.toLowerCase();
    const loader = lower.endsWith('.exr') ? new EXRLoader() : new HDRLoader();
    const texture = await loader.loadAsync(url);
    texture.mapping = THREE.EquirectangularReflectionMapping;

    this.environmentSource?.dispose?.();
    this.environmentTarget?.dispose?.();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const target = pmrem.fromEquirectangular(texture);
    pmrem.dispose();
    this.environmentSource = texture;
    this.environmentTarget = target;
    this.scene.environment = target.texture;
    this.scene.background = target.texture;
    this.resetTemporal('environment-change');
  }

  async setMaterialTextures(textures: MaterialTextureUrls): Promise<void> {
    this.assertAlive();
    const loader = new THREE.TextureLoader();
    const entries = await Promise.all(
      Object.entries(textures).map(async ([key, url]) => {
        if (!url) return [key, null] as const;
        const texture = await loader.loadAsync(url);
        texture.flipY = false;
        texture.anisotropy = Math.min(this.renderer.capabilities?.getMaxAnisotropy?.() ?? 4, 8);
        if (key === 'baseColor' || key === 'emissive') texture.colorSpace = THREE.SRGBColorSpace;
        return [key, texture] as const;
      })
    );

    for (const texture of this.materialTextures) texture.dispose?.();
    this.materialTextures = entries.map(([, texture]) => texture).filter(Boolean);
    const maps = Object.fromEntries(entries);

    this.modelRoot?.traverse((object: any) => {
      if (!object.isMesh) return;
      if (object.geometry?.attributes?.uv && !object.geometry.attributes.uv1) {
        object.geometry.setAttribute('uv1', object.geometry.attributes.uv);
      }
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!material?.isMeshStandardMaterial && !material?.isMeshPhysicalMaterial) continue;
        material.map = maps.baseColor ?? material.map;
        material.normalMap = maps.normal ?? material.normalMap;
        material.roughnessMap = maps.roughness ?? material.roughnessMap;
        material.metalnessMap = maps.metalness ?? material.metalnessMap;
        material.aoMap = maps.ambientOcclusion ?? material.aoMap;
        material.emissiveMap = maps.emissive ?? material.emissiveMap;
        if (maps.emissive) material.emissive.set(0xffffff);
        material.needsUpdate = true;
      }
    });
    this.resetTemporal('material-texture-change');
  }

  setEffect(name: EffectName, settings: Partial<EffectSettings>): void {
    this.assertAlive();
    const next = { ...this.effects[name], ...settings };
    this.effects[name] = next;

    if (next.enabled && ['fxaa', 'smaa', 'ssaa', 'traa'].includes(name)) {
      for (const aa of ['fxaa', 'smaa', 'ssaa', 'traa'] as EffectName[]) {
        if (aa !== name) this.effects[aa] = { ...this.effects[aa], enabled: false };
      }
    }
    this.resetTemporal(`effect-${name}`);
  }

  setQualityPreset(preset: QualityPreset): void {
    this.assertAlive();
    this.quality = preset;

    const defaults = cloneEffectDefaults();
    for (const name of Object.keys(defaults) as EffectName[]) {
      this.effects[name] = defaults[name];
    }

    const overrides = QUALITY_PRESETS[preset];
    for (const [name, settings] of Object.entries(overrides)) {
      this.effects[name as EffectName] = {
        ...this.effects[name as EffectName],
        ...settings
      };
    }
    this.enforceAaExclusivity();
    this.resetTemporal('quality-change');
  }

  setDebugBuffer(buffer: DebugBuffer): void {
    this.assertAlive();
    this.debugBuffer = buffer;
    this.resetTemporal('debug-buffer-change');
  }

  setAutoRotate(enabled: boolean): void {
    this.autoRotate = enabled;
  }

  setBackgroundGradient(enabled: boolean, top = 0x20252f, bottom = 0x05070b): void {
    this.setEffect('background', { enabled, top, bottom });
  }

  getEffectSettings(name: EffectName): EffectSettings {
    return structuredClone(this.effects[name]);
  }

  getMetrics(): ViewerMetrics {
    const info = this.renderer.info;
    return {
      backend: this.backend,
      fps: this.fps,
      cpuFrameTimeMs: this.cpuFrameTime,
      gpuFrameTimeMs: null,
      drawCalls: info?.render?.calls ?? 0,
      triangles: info?.render?.triangles ?? 0,
      textures: info?.memory?.textures ?? 0,
      renderTargets: this.graph.getRenderTargetEstimate(),
      quality: this.quality,
      debugBuffer: this.debugBuffer
    };
  }

  async capture(options: CaptureOptions = {}): Promise<Blob> {
    this.assertAlive();
    const oldSize = this.renderer.getSize(new THREE.Vector2());
    const width = Math.max(1, Math.round(options.width ?? oldSize.width));
    const height = Math.max(1, Math.round(options.height ?? oldSize.height));
    if (width !== oldSize.width || height !== oldSize.height) {
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.resetTemporal('capture-resize');
    }
    this.renderFrame();
    await this.renderer.backend?.waitForGPU?.();
    const blob = await canvasToBlob(
      this.canvas,
      options.mimeType ?? 'image/png',
      options.quality
    );
    if (width !== oldSize.width || height !== oldSize.height) {
      this.renderer.setSize(oldSize.width, oldSize.height, false);
      this.camera.aspect = oldSize.width / oldSize.height;
      this.camera.updateProjectionMatrix();
      this.resetTemporal('capture-restore');
    }
    return blob;
  }

  resize(width?: number, height?: number): void {
    this.assertAlive();
    const rect = this.canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(width ?? rect.width ?? this.canvas.clientWidth ?? 1));
    const nextHeight = Math.max(1, Math.round(height ?? rect.height ?? this.canvas.clientHeight ?? 1));
    this.renderer.setSize(nextWidth, nextHeight, false);
    this.camera.aspect = nextWidth / nextHeight;
    this.camera.updateProjectionMatrix();
    this.resetTemporal('resize');
  }

  reset(): void {
    this.assertAlive();
    fitObjectToView(this.modelRoot, this.camera, this.controls);
    this.resetTemporal('manual-reset');
  }

  start(): void {
    this.assertAlive();
    if (this.running) return;
    this.running = true;
    this.renderer.setAnimationLoop(() => this.renderFrame());
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  dispose(): void {
    if (this.disposed) return;
    this.stop();
    this.resizeObserver?.disconnect();
    this.controls.dispose();
    this.graph.dispose();
    disposeObject(this.modelRoot);
    for (const texture of this.materialTextures) texture.dispose?.();
    this.environmentSource?.dispose?.();
    this.environmentTarget?.dispose?.();
    this.renderer.dispose();
    this.disposed = true;
  }

  private renderFrame(): void {
    if (this.disposed) return;
    this.frameStart = performance.now();
    this.controls.update();
    if (this.autoRotate && this.modelRoot) this.modelRoot.rotation.y += 0.005;
    this.graph.render();
    this.cpuFrameTime = performance.now() - this.frameStart;
    this.fpsFrames += 1;
    const now = performance.now();
    const elapsed = now - this.fpsWindowStart;
    if (elapsed >= 500) {
      this.fps = (this.fpsFrames * 1000) / elapsed;
      this.fpsFrames = 0;
      this.fpsWindowStart = now;
    }
  }

  private resetTemporal(_reason: string): void {
    if (this.disposed) return;
    const background = this.effects.background;
    if (background.enabled) {
      this.graph.setGradientBackground(
        Number(background.top ?? 0x20252f),
        Number(background.bottom ?? 0x05070b)
      );
    } else {
      this.scene.backgroundNode = null;
    }
    this.graph.rebuild(this.effects, this.debugBuffer);
  }

  private enforceAaExclusivity(): void {
    const order: EffectName[] = ['ssaa', 'traa', 'smaa', 'fxaa'];
    const active = order.find((name) => this.effects[name].enabled);
    if (!active) return;
    for (const name of order) {
      if (name !== active) this.effects[name] = { ...this.effects[name], enabled: false };
    }
  }

  private observeResize(): void {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas);
  }

  private createLighting(): void {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x202030, 1.4);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 4);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    this.scene.add(key);
  }

  private createDefaultModel(): any {
    const root = new THREE.Group();
    root.name = 'Kyxos.DefaultMaterialStudy';

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x30343c,
      roughness: 0.55,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(3, 96), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.85;
    floor.receiveShadow = true;
    root.add(floor);

    const materials = [
      new THREE.MeshPhysicalMaterial({ color: 0xb9bec8, roughness: 0.12, metalness: 1 }),
      new THREE.MeshPhysicalMaterial({
        color: 0x9b6c42,
        roughness: 0.28,
        metalness: 0.15,
        clearcoat: 0.8,
        clearcoatRoughness: 0.12
      }),
      new THREE.MeshPhysicalMaterial({
        color: 0x1f6b7a,
        roughness: 0.4,
        metalness: 0,
        transmission: 0.05
      })
    ];
    const geometries = [
      new THREE.SphereGeometry(0.72, 96, 64),
      new THREE.TorusKnotGeometry(0.5, 0.18, 192, 32),
      new RoundedBoxGeometry(1.1, 1.1, 1.1, 6, 0.18)
    ];
    const positions = [-1.35, 0, 1.35];
    for (let i = 0; i < 3; i += 1) {
      const mesh = new THREE.Mesh(geometries[i], materials[i]);
      mesh.position.set(positions[i], 0, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      root.add(mesh);
    }
    return root;
  }

  private async installDefaultEnvironment(): Promise<void> {
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environmentTarget = pmrem.fromScene(room, 0.04);
    pmrem.dispose();
    room.dispose?.();
    this.scene.environment = this.environmentTarget.texture;
    this.scene.environmentIntensity = 1;
    this.resetTemporal('default-environment');
  }

  private assertAlive(): void {
    if (this.disposed) throw new Error('KyxosViewer has been disposed.');
  }
}
