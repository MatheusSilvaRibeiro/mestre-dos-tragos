import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Dashboard / Admin', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'ADMIN');
  });

  test('deve acessar o painel administrativo após login como ADMIN', async ({ page }) => {
    await expect(page).toHaveURL('/admin');
    await expect(page.getByTestId('sidebar-link-dashboard')).toBeVisible();
    await expect(page.getByTestId('sidebar-user-role')).toHaveText('ADMIN');
  });

  test('deve exibir cards/resumos do dashboard', async ({ page }) => {
    // Aguarda o carregamento das metricas (varias chamadas em paralelo no Dashboard.tsx).
    await expect(page.getByTestId('dashboard-loading')).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByTestId('dashboard-content')).toBeVisible();

    await expect(page.getByTestId('card-pedidos-hoje')).toBeVisible();
    await expect(page.getByTestId('card-faturamento-hoje')).toBeVisible();
    await expect(page.getByTestId('card-ticket-medio')).toBeVisible();
    await expect(page.getByTestId('card-pendentes')).toBeVisible();
  });

  test('deve carregar informações principais sem erro visual', async ({ page }) => {
    const errosDeConsole: string[] = [];
    page.on('pageerror', (err) => errosDeConsole.push(err.message));

    await expect(page.getByTestId('dashboard-content')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('dashboard-saudacao')).toBeVisible();

    // Nenhum erro JS nao tratado deve ter estourado ao renderizar a tela.
    expect(errosDeConsole).toEqual([]);
  });
});