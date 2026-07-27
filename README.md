# Kyxos Render Lab

A clean-room Kyxos material viewer built on the current official Three.js WebGPU stack:

```text
Three.js WebGPURenderer
+ Three.js TSL
+ Three.js RenderPipeline
+ Official WebGPU Effect Nodes
+ Kyxos Integration Layer
```

The project intentionally does not contain code from the former Kyxos Render Engine and does not use `postprocessing.EffectComposer` or `realism-effects` as a runtime dependency.

## Packages

```text
apps/playground   One application serving all visual demos
packages/viewer   Thin public KyxosViewer API and internal RenderPipeline graph
tests             Unit and browser smoke tests
```

## Run

```bash
corepack enable
pnpm install
pnpm dev
```

Validation:

```bash
pnpm verify
pnpm exec playwright install chromium
pnpm test:e2e
```

## Public API

```ts
import { KyxosViewer } from '@kyxos/viewer';

const viewer = await KyxosViewer.create({
  canvas,
  backend: 'auto',
  quality: 'high'
});

await viewer.loadModel(url);
await viewer.loadEnvironment(url);
await viewer.setMaterialTextures(textures);
viewer.setEffect('traa', { enabled: true });
viewer.setEffect('ssgi', { enabled: true });
viewer.setQualityPreset('high');

const metrics = viewer.getMetrics();
const image = await viewer.capture();
viewer.dispose();
```

No Three.js node, RenderPipeline, render target, MRT attachment, history texture, or internal effect instance is exposed by this API.

## Playground routes

`overview`, `pbr`, `buffers`, `aa`, `traa`, `temporal`, `gtao`, `ssao`, `ssr`, `ssgi`, `motion-blur`, `denoise`, `sharpness`, `lens-distortion`, `background`, `sparkle`, `full-stack`, `performance`, and `lifecycle` are all served by one shared application.

Append `?backend=webgl2` to force the official WebGL 2 backend. The default is automatic WebGPU with WebGL 2 fallback.

## Upstream policy

Three.js is pinned to an exact official commit because the temporal reprojection, recurrent denoise, SSAO, and RCAS sharpen nodes required by this viewer are ahead of the latest numbered release. See [UPSTREAM_MATRIX.md](UPSTREAM_MATRIX.md).
