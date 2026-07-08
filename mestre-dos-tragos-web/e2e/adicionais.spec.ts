import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { nomeAdicionalTeste } from './helpers/testData';

test.describe('Adicionais', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'ADMIN');
    await page.getByTestId('sidebar-link-cardapio').click();
    await expect(page).toHaveURL('/admin/cardapio');
    await page.getByTestId('cardapio-tab-adicionais').click();
  });

  test('deve cadastrar um adicional', async ({ page }) => {
    const nome = nomeAdicionalTeste();

    await page.getByTestId('adicional-nome-input').fill(nome);
    await page.getByTestId('adicional-preco-input').fill('3.50');
    await page.getByTestId('adicional-criar-btn').click();

    await expect(page.getByTestId('adicional-item').filter({ hasText: nome })).toBeVisible({ timeout: 15_000 });
  });

  test('deve listar o adicional', async ({ page }) => {
    const nome = nomeAdicionalTeste();

    await page.getByTestId('adicional-nome-input').fill(nome);
    await page.getByTestId('adicional-preco-input').fill('3.50');
    await page.getByTestId('adicional-criar-btn').click();

    await page.reload();
    await page.getByTestId('cardapio-tab-adicionais').click();
    await expect(page.getByTestId('adicional-item').filter({ hasText: nome })).toBeVisible({ timeout: 15_000 });
  });

  test('deve desativar o adicional (não há edição de nome/preço na tela atual — apenas ativar/desativar e excluir)', async ({ page }) => {
    const nome = nomeAdicionalTeste();

    await page.getByTestId('adicional-nome-input').fill(nome);
    await page.getByTestId('adicional-preco-input').fill('3.50');
    await page.getByTestId('adicional-criar-btn').click();

    const item = page.getByTestId('adicional-item').filter({ hasText: nome });
    await expect(item.getByTestId('adicional-item-toggle')).toHaveText('Ativo', { timeout: 15_000 });

    await item.getByTestId('adicional-item-toggle').click();
    await expect(item.getByTestId('adicional-item-toggle')).toHaveText('Inativo', { timeout: 15_000 });
  });

  test('deve excluir o adicional', async ({ page }) => {
    const nome = nomeAdicionalTeste();

    await page.getByTestId('adicional-nome-input').fill(nome);
    await page.getByTestId('adicional-preco-input').fill('3.50');
    await page.getByTestId('adicional-criar-btn').click();

    const item = page.getByTestId('adicional-item').filter({ hasText: nome });
    await expect(item).toBeVisible({ timeout: 15_000 });

    page.once('dialog', (dialog) => dialog.accept());
    await item.getByTestId('adicional-item-deletar').click();

    await expect(page.getByTestId('adicional-item').filter({ hasText: nome })).toHaveCount(0, { timeout: 15_000 });
  });
});