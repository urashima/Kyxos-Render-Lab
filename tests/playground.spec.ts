import { expect, test } from '@playwright/test';

test('WebGL2 fallback boots the shared playground and exposes metrics', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('performance/?backend=webgl2');
  await expect(page.getByRole('heading', { name: 'Performance' })).toBeVisible();
  await expect(page.locator('#status')).toContainText('Ready', { timeout: 45_000 });
  await expect(page.locator('#metrics')).toContainText('Backend');
  await expect(page.locator('#metrics')).toContainText('webgl2');
  expect(errors).toEqual([]);
});

test('all required static demo routes are generated', async ({ request }) => {
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
    const response = await request.get(route + '/');
    expect(response.ok(), route).toBe(true);
  }
  expect((await request.get('latest/overview/')).ok()).toBe(true);
});
