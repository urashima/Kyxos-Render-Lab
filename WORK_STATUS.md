# Work Status

## Branch

`feat/webgpu-realism-complete`

## Current state

Implementation complete on the feature branch pending remote CI, browser validation, merge, Pages deployment, and stable tag publication.

## Included

- pnpm + TypeScript + Vite workspace
- WebGPU auto path and forced WebGL 2 fallback
- one Scene MRT with beauty, depth, velocity, normal, diffuse, metalness, roughness, and emissive views
- official TRAA, SSAA, FXAA, SMAA, GTAO, SSAO, SSR, SSGI, temporal reprojection, spatial denoise, recurrent denoise, motion blur, bloom, DoF, LUT, tone mapping, and RCAS sharpen
- Kyxos lens distortion, gradual background, and sparkle TSL adapters
- five quality presets
- one routed Playground with all requested demos
- public viewer API, metrics, capture, reset, dispose/recreate, and lifecycle suite
- unit tests, Playwright smoke tests, CI, and Pages workflow

## Known validation limits

- GPU frame time is reported as unavailable when the active backend does not expose a supported timestamp result through Three.js.
- The lifecycle route executes the full 100/50 repetition acceptance suite in a real browser; CI runs the deterministic unit/build/route/backend smoke subset to avoid repeated remote asset downloads.
- The exact Three.js development commit is intentionally pinned and must be revalidated before any upstream upgrade.

## Next action

Run GitHub Actions, fix any reproducible failure, merge the single pull request, verify the public `/latest/` routes, and publish the first stable tag.
