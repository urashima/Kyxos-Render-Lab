# Upstream Matrix

Pinned Three.js source:

```text
repository: mrdoob/three.js
commit: 3cc8908cad65fe9a75c4fcf29c4f897c593443d5
package version at commit: 0.185.0
```

| Kyxos capability | Official upstream implementation | Kyxos treatment |
| --- | --- | --- |
| Renderer backend | `WebGPURenderer` | Direct use; automatic WebGPU/WebGL 2 selection |
| Render graph | `RenderPipeline` | Direct use |
| Scene buffers | `pass()` + `mrt()` | Direct use; no custom GBuffer |
| Velocity | TSL `velocity` | MRT attachment |
| TRAA | `TRAANode` | Direct use; MSAA disabled |
| Static SSAA | `SSAAPassNode` | Direct use for Capture preset |
| FXAA / SMAA | `FXAANode` / `SMAANode` | Direct use and mutually exclusive |
| GTAO / HBAO equivalent | `GTAONode` | Direct use |
| SSAO comparison | `SSAONode` | Direct use |
| SSR | `SSRNode` | Direct use |
| SSGI | `SSGINode` | Direct use |
| Temporal reprojection | `TemporalReprojectNode` | Direct use |
| Spatial denoise | `DenoiseNode` | Direct use |
| Temporal/recurrent denoise | `RecurrentDenoiseNode` | Direct use |
| Motion blur | official TSL `motionBlur()` | Direct use |
| Bloom | `BloomNode` | Direct use |
| Depth of field | `DepthOfFieldNode` | Direct use |
| LUT | `Lut3DNode` | Direct use with neutral built-in LUT |
| Tone mapping/output | TSL `renderOutput()` | Direct use |
| Sharpness | official `SharpenNode` (RCAS) | Direct use instead of a duplicate custom node |
| Lens distortion | no matching official display node selected | Small Kyxos TSL adapter |
| Gradual background | `Scene.backgroundNode` + TSL | Small Kyxos parameter adapter |
| Sparkle | no matching official display node selected | Small Kyxos TSL adapter |
| `realism-effects` | feature/visual/parameter reference only | Not installed and not copied |

## Upgrade gate

Any Three.js revision change must pass all unit, build, WebGL 2 fallback, WebGPU visual, temporal stability, and lifecycle checks before the pinned commit is updated.
