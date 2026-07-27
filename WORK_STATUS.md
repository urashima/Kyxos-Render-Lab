# Work Status

## Delivery

- Feature branch: `feat/webgpu-realism-complete`
- Pull request: `#1` — merged
- Merge commit: `2392875461a1951a9077204ac586690312080665`
- Current branch: `main`

## Current state

The clean-room Kyxos Viewer implementation is merged. The feature branch passed frozen dependency installation, formatting, ESLint, TypeScript, Vitest, Vite production build, Chromium WebGL 2 fallback startup, and all static route smoke tests.

GitHub Pages deployment is externally blocked because Pages has not yet been enabled for this new repository. The workflow contains the official `actions/configure-pages`, artifact upload, deployment, `/latest/` staging, manual dispatch, and post-deployment `v0.1.0` tag gate. The temporary `ci-pages-failed` tag records the current repository-setting blocker and is deleted automatically after a successful deployment.

## Included

- pnpm + frozen lockfile + TypeScript + Vite workspace
- WebGPU auto path and forced WebGL 2 fallback
- one Scene MRT with beauty, depth, velocity, normal, diffuse, metalness, roughness, and emissive views
- official TRAA, SSAA, FXAA, SMAA, GTAO, SSAO, SSR, SSGI, temporal reprojection, spatial denoise, recurrent denoise, motion blur, bloom, DoF, LUT, tone mapping, and RCAS sharpen
- Kyxos lens distortion, gradual background, and sparkle TSL adapters
- five quality presets
- one routed Playground with all requested demos
- public viewer API, metrics, capture, reset, dispose/recreate, and lifecycle suite
- unit tests, Playwright smoke tests, CI, Pages workflow, and stable-tag release gate

## Known validation limits

- GPU frame time is reported as unavailable when the active backend does not expose a supported timestamp result through Three.js.
- The lifecycle route executes the full 100/50 repetition acceptance suite in a real browser; CI runs the deterministic unit/build/route/backend smoke subset to avoid repeated remote asset downloads.
- WebGPU visual acceptance requires opening the public Playground in a WebGPU-capable browser after Pages is enabled.
- The exact Three.js development commit is intentionally pinned and must be revalidated before any upstream upgrade.

## Next action

In repository **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**. Then run the **CI and Pages** workflow on `main`. A successful run deploys `/latest/`, removes `ci-pages-failed`, and creates stable tag `v0.1.0` automatically.
