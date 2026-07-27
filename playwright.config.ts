import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4173/Kyxos-Render-Lab/',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'pnpm --filter @kyxos/playground preview --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/Kyxos-Render-Lab/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
        }
      }
    }
  ]
});
