import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium-desktop',
      // 1280x720 (padrao do device) e baixo demais e nao representa o uso real;
      // com ele o prontuario nao cabe e os testes ficam presos em rolagem.
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'mobile-iphone',
      use: { ...devices['iPhone 13'] }
    },
    {
      name: 'mobile-pixel',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'ipad',
      use: { ...devices['iPad Pro 11'] }
    },
    {
      name: 'ipad-landscape',
      use: { ...devices['iPad Pro 11 landscape'] }
    }
  ],
  webServer: {
    command: 'npm run dev -- -p 3002',
    url: 'http://localhost:3002',
    reuseExistingServer: true,
    timeout: 120_000
  }
});
