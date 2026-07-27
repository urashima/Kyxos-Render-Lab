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

test('bloom preserves visible scene pixels instead of replacing the scene', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('performance/?backend=webgl2');
  await expect(page.getByRole('heading', { name: 'Performance' })).toBeVisible();
  await expect(page.locator('#status')).toContainText('Ready', { timeout: 45_000 });
  await expect(page.locator('#metrics')).toContainText('webgl2');

  const bloomToggle = page.locator('input[data-effect="bloom"][data-key="enabled"]');
  await expect(bloomToggle).not.toBeChecked();
  await bloomToggle.check();

  const pixelStats = await page.evaluate(async () => {
    const canvas = document.querySelector<HTMLCanvasElement>('#viewer-canvas');
    if (!canvas) throw new Error('Missing viewer canvas.');

    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    const image = new Image();
    image.src = canvas.toDataURL('image/png');
    await image.decode();

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 96;
    sampleCanvas.height = 64;
    const context = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Unable to create sampling context.');
    context.drawImage(image, 0, 0, sampleCanvas.width, sampleCanvas.height);

    const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
    let visiblePixels = 0;
    let luminanceSum = 0;
    const pixelCount = pixels.length / 4;

    for (let offset = 0; offset < pixels.length; offset += 4) {
      const red = pixels[offset] ?? 0;
      const green = pixels[offset + 1] ?? 0;
      const blue = pixels[offset + 2] ?? 0;
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
      luminanceSum += luminance;
      if (luminance > 8) visiblePixels += 1;
    }

    return {
      averageLuminance: luminanceSum / pixelCount,
      visibleRatio: visiblePixels / pixelCount
    };
  });

  expect(pixelStats.averageLuminance).toBeGreaterThan(3);
  expect(pixelStats.visibleRatio).toBeGreaterThan(0.05);
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
