import { test, expect } from '@playwright/test';
import { ADMIN_STORAGE_STATE } from './helpers/storageState';
import { nomeAdicionalTeste } from './helpers/testData';
import { capturarIdCriado, deletarAdicional } from './helpers/cleanup';

// Sessao de ADMIN pre-carregada (ver e2e/global-setup.ts) — sem login por
// teste, poupa o rate limit de login do backend.
test.use({ storageState: ADMIN_STORAGE_STATE });

test.describe('Adicionais', () => {
  let adicionaisCriados: string[] = [];

  test.beforeEach(async ({ page }) => {
    adicionaisCriados = [];
    await page.goto('/admin/cardapio');
    await page.getByTestId('cardapio-tab-adicionais').click();
  });

  test.afterEach(async ({ page }) => {
    for (const id of adicionaisCriados) await deletarAdicional(page, id);
  });

  async function criarAdicional(page: import('@playwright/test').Page, nome: string, preco: string) {
    const idPromise = capturarIdCriado(page, '/adicionais');
    await page.getByTestId('adicional-nome-input').fill(nome);
    await page.getByTestId('adicional-preco-input').fill(preco);
    await page.getByTestId('adicional-criar-btn').click();
    const id = await idPromise;
    if (id) adicionaisCriados.push(id);
  }

  test('deve cadastrar um adicional', async ({ page }) => {
    const nome = nomeAdicionalTeste();

    await criarAdicional(page, nome, '3.50');

    await expect(page.getByTestId('adicional-item').filter({ hasText: nome })).toBeVisible({ timeout: 15_000 });
  });

  test('deve listar o adicional', async ({ page }) => {
    const nome = nomeAdicionalTeste();

    await criarAdicional(page, nome, '3.50');

    await page.reload();
    await page.getByTestId('cardapio-tab-adicionais').click();
    await expect(page.getByTestId('adicional-item').filter({ hasText: nome })).toBeVisible({ timeout: 15_000 });
  });

  test('deve desativar o adicional (não há edição de nome/preço na tela atual — apenas ativar/desativar e excluir)', async ({ page }) => {
    const nome = nomeAdicionalTeste();

    await criarAdicional(page, nome, '3.50');

    const item = page.getByTestId('adicional-item').filter({ hasText: nome });
    await expect(item.getByTestId('adicional-item-toggle')).toHaveText('Ativo', { timeout: 15_000 });

    await item.getByTestId('adicional-item-toggle').click();
    await expect(item.getByTestId('adicional-item-toggle')).toHaveText('Inativo', { timeout: 15_000 });
  });

  test('deve excluir o adicional', async ({ page }) => {
    const nome = nomeAdicionalTeste();

    await criarAdicional(page, nome, '3.50');

    const item = page.getByTestId('adicional-item').filter({ hasText: nome });
    await expect(item).toBeVisible({ timeout: 15_000 });

    page.once('dialog', (dialog) => dialog.accept());
    await item.getByTestId('adicional-item-deletar').click();

    await expect(page.getByTestId('adicional-item').filter({ hasText: nome })).toHaveCount(0, { timeout: 15_000 });

    adicionaisCriados = [];
  });
});