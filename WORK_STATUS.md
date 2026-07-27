# Work Status

## Delivery

- Feature branch: `feat/webgpu-realism-complete`
- Pull request: `#1` — merged
- Merge commit: `2392875461a1951a9077204ac586690312080665`
- Current branch: `main`
- Stable tag: `v0.1.0`
- Online verification tag: `pages-online-verified`
- Public Playground: `https://urashima.github.io/Kyxos-Render-Lab/latest/`

## Current state

The clean-room Kyxos Viewer implementation is merged and deployed through GitHub Pages. Frozen dependency installation, formatting, ESLint, TypeScript, Vitest, Vite production build, Chromium WebGL 2 fallback startup, and all static route smoke tests passed.

The post-deployment online gate successfully fetched the published `/latest/`, `/latest/overview/`, `/latest/full-stack/`, and `/latest/lifecycle/` routes and verified the Kyxos application shell. The previous `ci-pages-failed` marker was removed automatically after the successful deployment.

## Included

- pnpm + frozen lockfile + TypeScript + Vite workspace
- WebGPU auto path and forced WebGL 2 fallback
- one Scene MRT with beauty, depth, velocity, normal, diffuse, metalness, roughness, and emissive views
- official TRAA, SSAA, FXAA, SMAA, GTAO, SSAO, SSR, SSGI, temporal reprojection, spatial denoise, recurrent denoise, motion blur, bloom, DoF, LUT, tone mapping, and RCAS sharpen
- Kyxos lens distortion, gradual background, and sparkle TSL adapters
- five quality presets
- one routed Playground with all requested demos
- public viewer API, metrics, capture, reset, dispose/recreate, and lifecycle suite
- unit tests, Playwright smoke tests, CI, Pages deployment, public-route verification, and stable-tag release gate

## Known validation limits

- GPU frame time is reported as unavailable when the active backend does not expose a supported timestamp result through Three.js.
- The lifecycle route provides the full 100/50 repetition acceptance suite; CI runs deterministic unit/build/route/backend checks and does not automatically execute the long interactive stress suite.
- The online gate verifies deployment and route availability. Final WebGPU visual acceptance of TRAA stability, velocity, SSR, SSGI, temporal effects, and GPU timing still requires opening the public Playground in a WebGPU-capable browser.
- The exact Three.js development commit is intentionally pinned and must be revalidated before any upstream upgrade.

## Next action

Open the public `/latest/` Playground in a WebGPU-capable browser, confirm the metrics panel reports `webgpu`, then perform the visual and lifecycle acceptance checklist from the routed demos.
