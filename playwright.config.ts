import { defineConfig } from '@playwright/test';

// Headless Chromium needs a GPU path for WebGL: ANGLE/D3D11 on Windows, SwiftShader elsewhere.
const gpuArgs =
  process.platform === 'win32'
    ? ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11']
    : ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 1600, height: 900 },
    launchOptions: { args: gpuArgs },
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
