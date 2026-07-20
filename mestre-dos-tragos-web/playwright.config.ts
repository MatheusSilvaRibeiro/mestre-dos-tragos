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
  // Roda os 3 logins reais (ADMIN/ATENDENTE/COZINHA) uma unica vez antes
  // de toda a suite, salvando sessao em e2e/.auth/*.json. Existe por causa
  // do rate limit de login do backend (5 tentativas/15min por IP) — ver
  // e2e/helpers/storageState.ts.
  globalSetup: './e2e/global-setup.ts',
  // O backend tambem tem um rate limit GERAL (100 requisicoes/15min por
  // IP, todas as rotas — nao so login). Com o padrao de 4+ workers em
  // paralelo, a suite inteira facilmente passa de 100 requisicoes nos
  // primeiros segundos (cada criacao de categoria sozinha ja faz 4 —
  // 1 POST + 3 GETs de recarga). Reduzido pra 2 workers pra espalhar as
  // requisicoes ao longo do tempo em vez de rajar tudo de uma vez.
  workers: 2,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // Roda contra o BUILD de producao (build + preview), nao contra `vite dev`.
  // Em dev o React StrictMode roda os efeitos duas vezes de proposito (monta,
  // desmonta, monta de novo) — isso duplica a conexao do WebSocket da cozinha
  // e gera falsos-negativos (status de pedido nao refletindo na tela dentro
  // do timeout). Contra o build de producao (sem esse double-invoke) a
  // mesma suite passa limpa. O backend fica de fora de proposito — ele
  // depende de qual banco usar (producao ou o de dev), decisao que nao deve
  // ficar escondida aqui; suba-o manualmente antes de rodar os testes.
  webServer: {
    command: 'npm run build && npx vite preview --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});