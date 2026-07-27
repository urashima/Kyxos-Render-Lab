import {
  EFFECT_DEFAULTS,
  KyxosViewer,
  type DebugBuffer,
  type EffectName,
  type EffectSettings,
  type QualityPreset
} from '@kyxos/viewer';
import './styles.css';

const BASE = import.meta.env.BASE_URL;
const ROUTES = [
  'overview',
  'pbr',
  'buffers',
  'aa',
  'traa',
  'temporal',
  'gtao',
  'ssao',
  'ssr',
  'ssgi',
  'motion-blur',
  'denoise',
  'sharpness',
  'lens-distortion',
  'background',
  'sparkle',
  'full-stack',
  'performance',
  'lifecycle'
] as const;

type RouteName = (typeof ROUTES)[number];

const DEMOS: Record<
  RouteName,
  { title: string; description: string; focus: EffectName[]; preset: QualityPreset }
> = {
  overview: {
    title: 'Complete WebGPU Viewer',
    description: 'One RenderPipeline, one Scene MRT, official TSL effects, and a thin Kyxos API.',
    focus: ['traa', 'gtao', 'ssr', 'ssgi', 'bloom', 'lut', 'sharpness'],
    preset: 'high'
  },
  pbr: {
    title: 'PBR / HDR / GLTF',
    description: 'Material study scene, GLTF switching, HDR/EXR environment loading, and Texture Lab maps.',
    focus: ['traa', 'gtao', 'bloom', 'lut'],
    preset: 'high'
  },
  buffers: {
    title: 'Unified Scene MRT',
    description: 'Beauty, depth, velocity, normal, diffuse, metalness, roughness, and emissive debug views.',
    focus: [],
    preset: 'low'
  },
  aa: {
    title: 'AA Comparison',
    description: 'FXAA, SMAA, TRAA, and SSAA are mutually exclusive. Hardware MSAA remains disabled.',
    focus: ['fxaa', 'smaa', 'traa', 'ssaa'],
    preset: 'medium'
  },
  traa: {
    title: 'Official TRAA',
    description: 'Three.js TRAANode consumes beauty, depth, velocity, and camera state.',
    focus: ['traa'],
    preset: 'medium'
  },
  temporal: {
    title: 'Temporal Reprojection',
    description: 'Official TemporalReprojectNode and recurrent denoise from the pinned Three.js dev commit.',
    focus: ['temporal', 'temporalDenoise'],
    preset: 'high'
  },
  gtao: {
    title: 'GTAO',
    description: 'Official GTAONode replaces HBAO while preserving the same product capability.',
    focus: ['gtao'],
    preset: 'medium'
  },
  ssao: {
    title: 'SSAO Reference',
    description: 'Official SSAONode provides the lower-cost comparison path and integrated depth-aware blur.',
    focus: ['ssao'],
    preset: 'low'
  },
  ssr: {
    title: 'Screen-Space Reflections',
    description: 'Official SSRNode consumes beauty, depth, normals, metalness, and roughness from the MRT.',
    focus: ['ssr'],
    preset: 'medium'
  },
  ssgi: {
    title: 'Screen-Space Global Illumination',
    description: 'Official SSGINode with optional temporal filtering and TRAA composition.',
    focus: ['ssgi', 'traa', 'temporalDenoise'],
    preset: 'high'
  },
  'motion-blur': {
    title: 'Motion Blur',
    description: 'Official TSL motionBlur() samples the unified velocity attachment.',
    focus: ['motionBlur'],
    preset: 'cinematic'
  },
  denoise: {
    title: 'Spatial and Recurrent Denoise',
    description: 'Official DenoiseNode and RecurrentDenoiseNode are both available in the graph.',
    focus: ['denoise', 'temporalDenoise'],
    preset: 'high'
  },
  sharpness: {
    title: 'Sharpness',
    description: 'The current official Three.js RCAS SharpenNode is reused instead of writing a duplicate node.',
    focus: ['sharpness'],
    preset: 'high'
  },
  'lens-distortion': {
    title: 'Lens Distortion',
    description: 'Small Kyxos TSL adapter for radial lens distortion after tone mapping and LUT.',
    focus: ['lensDistortion'],
    preset: 'cinematic'
  },
  background: {
    title: 'Gradual Background',
    description: 'Scene backgroundNode uses a TSL gradient and can be disabled to reveal the HDR background.',
    focus: ['background'],
    preset: 'high'
  },
  sparkle: {
    title: 'Sparkle',
    description: 'Small Kyxos TSL adapter gates deterministic sparkle by metalness and roughness.',
    focus: ['sparkle'],
    preset: 'high'
  },
  'full-stack': {
    title: 'Full Realism Stack',
    description: 'GTAO → SSGI → SSR → TRAA → motion blur → bloom/DoF → tone map → LUT → lens → sharpen.',
    focus: [
      'gtao',
      'ssr',
      'ssgi',
      'traa',
      'motionBlur',
      'bloom',
      'dof',
      'lut',
      'lensDistortion',
      'sharpness'
    ],
    preset: 'cinematic'
  },
  performance: {
    title: 'Performance',
    description: 'Live backend, FPS, CPU frame time, draw calls, triangles, textures, and target estimate.',
    focus: ['gtao', 'ssr', 'ssgi', 'traa'],
    preset: 'low'
  },
  lifecycle: {
    title: 'Lifecycle Validation',
    description: 'Executable resize, toggle, asset-switch, and create/dispose stress tests.',
    focus: [],
    preset: 'low'
  }
};

const MODEL_URLS = {
  'Damaged Helmet': 'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
  BoomBox: 'https://threejs.org/examples/models/gltf/BoomBox/glTF-Binary/BoomBox.glb'
};

const ENVIRONMENT_URLS = {
  'Royal Esplanade': 'https://threejs.org/examples/textures/equirectangular/royal_esplanade_1k.hdr',
  'Venice Sunset': 'https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr'
};

const DEBUG_BUFFERS: DebugBuffer[] = [
  'beauty',
  'depth',
  'velocity',
  'normal',
  'diffuseColor',
  'metalness',
  'roughness',
  'emissive'
];

const { route, latestPrefix } = resolveRoute();
const backend = resolveBackend();
const demo = DEMOS[route];
const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app root.');

app.innerHTML = `
  <main class="shell">
    <nav class="nav">
      <div class="brand"><strong>Kyxos Render Lab</strong><small>Three.js WebGPU / TSL</small></div>
      ${ROUTES.map(
        (item) =>
          `<a href="${BASE}${latestPrefix}${item}/" ${item === route ? 'aria-current="page"' : ''}>${formatName(item)}</a>`
      ).join('')}
    </nav>
    <section class="stage">
      <canvas id="viewer-canvas" aria-label="Kyxos WebGPU material viewer"></canvas>
      <div class="hud"><h1>${demo.title}</h1><p>${demo.description}</p></div>
      <div class="metrics" id="metrics"></div>
    </section>
    <aside class="panel">
      <h2>Viewer Controls</h2>
      <div id="controls"></div>
      <div class="status" id="status">Initializing renderer…</div>
    </aside>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#viewer-canvas')!;
const controlsRoot = document.querySelector<HTMLDivElement>('#controls')!;
const metricsRoot = document.querySelector<HTMLDivElement>('#metrics')!;
const statusRoot = document.querySelector<HTMLDivElement>('#status')!;

let viewer: KyxosViewer;
let bypassSnapshot: Partial<Record<EffectName, EffectSettings>> | null = null;

await createViewer();
renderControls();
setStatus(`Ready: ${demo.title}`);
setInterval(renderMetrics, 250);

async function createViewer(): Promise<void> {
  viewer?.dispose();
  viewer = await KyxosViewer.create({
    canvas,
    backend,
    quality: demo.preset,
    autoStart: true
  });
  applyDemoState();
}

function applyDemoState(): void {
  viewer.setQualityPreset(demo.preset);
  viewer.setAutoRotate(route === 'motion-blur' || route === 'sparkle');

  if (route === 'buffers') viewer.setDebugBuffer('normal');
  if (route === 'traa') {
    viewer.setEffect('ssgi', { enabled: false });
    viewer.setEffect('ssr', { enabled: false });
  }
  if (route === 'temporal') {
    viewer.setEffect('traa', { enabled: false });
    viewer.setEffect('temporal', { enabled: true });
    viewer.setEffect('temporalDenoise', { enabled: true });
  }
  if (route === 'ssao') {
    viewer.setEffect('gtao', { enabled: false });
    viewer.setEffect('ssao', { enabled: true });
  }
  if (route === 'denoise') viewer.setEffect('denoise', { enabled: true });
  if (route === 'lens-distortion') viewer.setEffect('lensDistortion', { enabled: true });
  if (route === 'sparkle') viewer.setEffect('sparkle', { enabled: true });
  if (route === 'background') viewer.setEffect('background', { enabled: true });
}

function renderControls(): void {
  controlsRoot.innerHTML = `
    <section class="section">
      <label class="row"><span>Quality preset</span><select id="quality-select">
        ${(['low', 'medium', 'high', 'cinematic', 'capture'] as QualityPreset[])
          .map((item) => `<option value="${item}" ${item === demo.preset ? 'selected' : ''}>${item}</option>`)
          .join('')}
      </select></label>
      <label class="row"><span>Debug buffer</span><select id="buffer-select">
        ${DEBUG_BUFFERS.map((item) => `<option value="${item}">${item}</option>`).join('')}
      </select></label>
      <label class="row"><span>Before / After bypass</span><input id="bypass" type="checkbox" /></label>
    </section>
    <section class="section">
      <label class="row"><span>Model</span><select id="model-select">
        <option value="">Procedural study</option>
        ${Object.entries(MODEL_URLS)
          .map(([name, url]) => `<option value="${url}">${name}</option>`)
          .join('')}
      </select></label>
      <label class="row"><span>Environment</span><select id="environment-select">
        <option value="">Room environment</option>
        ${Object.entries(ENVIRONMENT_URLS)
          .map(([name, url]) => `<option value="${url}">${name}</option>`)
          .join('')}
      </select></label>
    </section>
    <section class="section">
      ${Object.keys(EFFECT_DEFAULTS)
        .map((name) => effectEditor(name as EffectName))
        .join('')}
    </section>
    <section class="section actions">
      <button id="reset">Reset</button>
      <button id="capture">Capture</button>
      <button id="recreate" class="wide">Dispose / Recreate</button>
      ${route === 'lifecycle' ? '<button id="stress" class="wide">Run 100/50 Lifecycle Suite</button>' : ''}
    </section>
  `;

  bindControls();
}

function effectEditor(name: EffectName): string {
  const settings = viewer.getEffectSettings(name);
  const open = demo.focus.includes(name) ? 'open' : '';
  const fields = Object.entries(settings)
    .filter(([key]) => key !== 'enabled')
    .map(([key, value]) => {
      if (typeof value === 'boolean') {
        return `<label class="row"><span>${formatName(key)}</span><input data-effect="${name}" data-key="${key}" type="checkbox" ${value ? 'checked' : ''} /></label>`;
      }
      return `<label class="row"><span>${formatName(key)}</span><input data-effect="${name}" data-key="${key}" type="number" step="any" value="${String(value)}" /></label>`;
    })
    .join('');
  return `<details ${open}><summary>${formatName(name)}</summary>
    <label class="row"><span>Enabled</span><input data-effect="${name}" data-key="enabled" type="checkbox" ${settings.enabled ? 'checked' : ''} /></label>
    ${fields}
  </details>`;
}

function bindControls(): void {
  document.querySelector<HTMLSelectElement>('#quality-select')?.addEventListener('change', (event) => {
    viewer.setQualityPreset((event.target as HTMLSelectElement).value as QualityPreset);
    renderControls();
  });

  document.querySelector<HTMLSelectElement>('#buffer-select')?.addEventListener('change', (event) => {
    viewer.setDebugBuffer((event.target as HTMLSelectElement).value as DebugBuffer);
  });

  document.querySelector<HTMLInputElement>('#bypass')?.addEventListener('change', (event) => {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      bypassSnapshot = {};
      for (const name of demo.focus) {
        bypassSnapshot[name] = viewer.getEffectSettings(name);
        viewer.setEffect(name, { enabled: false });
      }
    } else if (bypassSnapshot) {
      for (const [name, settings] of Object.entries(bypassSnapshot)) {
        viewer.setEffect(name as EffectName, settings);
      }
      bypassSnapshot = null;
    }
  });

  document.querySelector<HTMLSelectElement>('#model-select')?.addEventListener('change', async (event) => {
    const url = (event.target as HTMLSelectElement).value;
    if (!url) return;
    await runStatus('Loading GLTF model', () => viewer.loadModel(url));
  });

  document
    .querySelector<HTMLSelectElement>('#environment-select')
    ?.addEventListener('change', async (event) => {
      const url = (event.target as HTMLSelectElement).value;
      if (!url) return;
      await runStatus('Loading HDR environment', () => viewer.loadEnvironment(url));
    });

  document.querySelectorAll<HTMLInputElement>('[data-effect]').forEach((input) => {
    input.addEventListener('change', () => {
      const name = input.dataset.effect as EffectName;
      const key = input.dataset.key as string;
      const value = input.type === 'checkbox' ? input.checked : Number(input.value);
      viewer.setEffect(name, { [key]: value });
      if (key === 'enabled' && ['fxaa', 'smaa', 'ssaa', 'traa'].includes(name)) renderControls();
    });
  });

  document.querySelector<HTMLButtonElement>('#reset')?.addEventListener('click', () => viewer.reset());
  document.querySelector<HTMLButtonElement>('#capture')?.addEventListener('click', captureImage);
  document.querySelector<HTMLButtonElement>('#recreate')?.addEventListener('click', async () => {
    await runStatus('Recreating viewer', createViewer);
    renderControls();
  });
  document.querySelector<HTMLButtonElement>('#stress')?.addEventListener('click', runLifecycleSuite);
}

function renderMetrics(): void {
  if (!viewer) return;
  const metrics = viewer.getMetrics();
  metricsRoot.innerHTML = [
    ['Backend', metrics.backend],
    ['FPS', metrics.fps.toFixed(1)],
    ['CPU', `${metrics.cpuFrameTimeMs.toFixed(2)} ms`],
    ['GPU', metrics.gpuFrameTimeMs == null ? 'N/A' : `${metrics.gpuFrameTimeMs.toFixed(2)} ms`],
    ['Draw Calls', metrics.drawCalls.toLocaleString()],
    ['Triangles', metrics.triangles.toLocaleString()],
    ['Textures', metrics.textures.toLocaleString()],
    ['Targets', metrics.renderTargets.toLocaleString()]
  ]
    .map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`)
    .join('');
}

async function captureImage(): Promise<void> {
  await runStatus('Capturing PNG', async () => {
    const blob = await viewer.capture({ mimeType: 'image/png' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kyxos-${route}.png`;
    link.click();
    URL.revokeObjectURL(link.href);
  });
}

async function runLifecycleSuite(): Promise<void> {
  const before = viewer.getMetrics();
  setStatus('Lifecycle suite: resize 100×');
  for (let i = 0; i < 100; i += 1) viewer.resize(640 + (i % 7), 360 + (i % 5));
  viewer.resize();

  setStatus('Lifecycle suite: effect toggle 100×');
  for (let i = 0; i < 100; i += 1) viewer.setEffect('sparkle', { enabled: i % 2 === 0 });
  viewer.setEffect('sparkle', { enabled: false });

  const modelUrls = Object.values(MODEL_URLS);
  setStatus('Lifecycle suite: model switch 50×');
  for (let i = 0; i < 50; i += 1) await viewer.loadModel(modelUrls[i % modelUrls.length]!);

  const environmentUrls = Object.values(ENVIRONMENT_URLS);
  setStatus('Lifecycle suite: HDR switch 50×');
  for (let i = 0; i < 50; i += 1) {
    await viewer.loadEnvironment(environmentUrls[i % environmentUrls.length]!);
  }

  setStatus('Lifecycle suite: create/dispose 50×');
  for (let i = 0; i < 50; i += 1) {
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 64;
    testCanvas.height = 64;
    const testViewer = await KyxosViewer.create({
      canvas: testCanvas,
      backend: 'webgl2',
      quality: 'low',
      autoStart: false,
      pixelRatio: 1
    });
    testViewer.dispose();
  }

  const after = viewer.getMetrics();
  setStatus(
    `Lifecycle suite passed.\nBefore textures: ${before.textures}\nAfter textures: ${after.textures}\nBefore targets: ${before.renderTargets}\nAfter targets: ${after.renderTargets}`
  );
}

async function runStatus(label: string, task: () => Promise<void>): Promise<void> {
  setStatus(`${label}…`);
  try {
    await task();
    setStatus(`${label}: complete`);
  } catch (error) {
    setStatus(`${label}: failed\n${error instanceof Error ? error.message : String(error)}`);
  }
}

function setStatus(message: string): void {
  statusRoot.textContent = message;
}

function resolveBackend(): 'auto' | 'webgpu' | 'webgl2' {
  const requested = new URLSearchParams(window.location.search).get('backend');
  return requested === 'webgpu' || requested === 'webgl2' ? requested : 'auto';
}

function resolveRoute(): { route: RouteName; latestPrefix: string } {
  const path = window.location.pathname.replace(BASE, '').split('/').filter(Boolean);
  const latest = path[0] === 'latest';
  const candidate = (latest ? path[1] : path[0]) ?? 'overview';
  return {
    route: ROUTES.includes(candidate as RouteName) ? (candidate as RouteName) : 'overview',
    latestPrefix: latest ? 'latest/' : ''
  };
}

function formatName(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
