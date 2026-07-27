# Development Plan

## Delivery model

All implementation is performed on `feat/webgpu-realism-complete` and delivered through one pull request. There are no Phase documents or parallel rendering architectures.

## Checkpoints

1. Bootstrap the pnpm/TypeScript/Vite workspace.
2. Build the thin `KyxosViewer` integration API.
3. Add procedural PBR, GLTF, HDR/EXR, environment, and Texture Lab texture inputs.
4. Build one official Scene Pass MRT and all debug views.
5. Compose official AA, AO, reflection, GI, temporal, denoise, motion, bloom, DoF, LUT, and sharpen nodes.
6. Add only the missing small Kyxos TSL adapters: lens distortion, gradual background, and sparkle.
7. Add five deterministic quality presets, shared playground routes, metrics, capture, reset, disposal, and lifecycle stress controls.
8. Gate with formatting, linting, type checking, unit tests, build, browser smoke tests, CI, and GitHub Pages.

## Architecture constraints

- `WebGPURenderer` owns WebGPU and WebGL 2 backend selection.
- `RenderPipeline` owns graph execution.
- `pass()` and `mrt()` own the shared scene attachments.
- Official effect nodes own their internal render targets and temporal history.
- Temporal reset is implemented by disposing and rebuilding official nodes; no History Manager or Frame Scheduler exists.
- AA modes are mutually exclusive and hardware MSAA remains disabled.
- Advanced effects may be disabled individually without replacing the renderer or graph.
