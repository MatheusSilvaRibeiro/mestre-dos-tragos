import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // A API roda no plano free do Render, que pode levar dezenas de segundos
  // para "acordar" no primeiro request (cold start) de cada execucao.
  // 30s era suficiente so para um backend local; testes que fazem login
  // (que por si so ja pode usar ate 60s, ver e2e/helpers/auth.ts) precisam
  // de folga adicional para os passos depois do login.
  timeout: 90_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});