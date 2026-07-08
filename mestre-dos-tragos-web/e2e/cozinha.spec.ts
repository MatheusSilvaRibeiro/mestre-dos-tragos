import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

/**
 * Suite da Cozinha.
 *
 * Assim como em pedidos.spec.ts, esta suite depende de haver pelo menos
 * 1 pedido com status PENDENTE no backend de teste no momento da execução
 * (criado manualmente, via seed, ou pela suite de pedidos rodando antes
 * em série — com `fullyParallel: false` e um `test.describe.serial`, se
 * for esse o approach escolhido para o projeto).
 */
test.describe('Cozinha', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'COZINHA');
    await expect(page).toHaveURL('/cozinha');
  });

  test('deve acessar a tela da cozinha', async ({ page }) => {
    await expect(page.getByTestId('cozinha-loading')).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByText('Cozinha')).toBeVisible();
  });

  test('deve listar pedidos pendentes', async ({ page }) => {
    await expect(page.getByTestId('cozinha-loading')).toHaveCount(0, { timeout: 15_000 });

    const coluna = page.getByTestId('cozinha-coluna-pendentes');
    await expect(coluna).toBeVisible();
  });

  test('deve alterar status do pedido para EM_PREPARO', async ({ page }) => {
    await expect(page.getByTestId('cozinha-loading')).toHaveCount(0, { timeout: 15_000 });

    const cardPendente = page
      .getByTestId('cozinha-coluna-pendentes')
      .getByTestId('cozinha-pedido-card')
      .first();

    if ((await cardPendente.count()) === 0) {
      test.skip(true, 'Nenhum pedido pendente no momento da execução.');
    }

    const idPedido = await cardPendente.getAttribute('data-pedido-id');
    await cardPendente.getByTestId('cozinha-aceitar-btn').click();

    // O pedido some da coluna de pendentes e passa a aparecer em "Em Preparo".
    await expect(page.getByTestId('cozinha-coluna-pendentes').locator(`[data-pedido-id="${idPedido}"]`)).toHaveCount(0, { timeout: 10_000 });
    await expect(page.getByTestId('cozinha-coluna-em-preparo').locator(`[data-pedido-id="${idPedido}"]`)).toBeVisible();
  });

  test('deve alterar status do pedido para PRONTO e refletir visualmente', async ({ page }) => {
    await expect(page.getByTestId('cozinha-loading')).toHaveCount(0, { timeout: 15_000 });

    const cardEmPreparo = page
      .getByTestId('cozinha-coluna-em-preparo')
      .getByTestId('cozinha-pedido-card')
      .first();

    if ((await cardEmPreparo.count()) === 0) {
      test.skip(true, 'Nenhum pedido em preparo no momento da execução.');
    }

    const idPedido = await cardEmPreparo.getAttribute('data-pedido-id');
    await cardEmPreparo.getByTestId('cozinha-finalizar-btn').click();

    // Pedido PRONTO some das colunas ativas (a cozinha só lista PENDENTE/EM_PREPARO).
    await expect(page.locator(`[data-pedido-id="${idPedido}"]`)).toHaveCount(0, { timeout: 10_000 });
  });
});