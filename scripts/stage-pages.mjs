import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve('apps/playground/dist');
const index = await readFile(resolve(dist, 'index.html'), 'utf8');
const routes = [
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
];

for (const route of routes) {
  const routeDir = resolve(dist, route);
  await mkdir(routeDir, { recursive: true });
  await writeFile(resolve(routeDir, 'index.html'), index);
}

const latestDir = resolve(dist, 'latest');
await mkdir(latestDir, { recursive: true });
await writeFile(resolve(latestDir, 'index.html'), index);
for (const route of routes) {
  const routeDir = resolve(latestDir, route);
  await mkdir(routeDir, { recursive: true });
  await writeFile(resolve(routeDir, 'index.html'), index);
}

await cp(resolve(dist, 'index.html'), resolve(dist, '404.html'));
