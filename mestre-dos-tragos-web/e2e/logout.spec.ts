import { test, expect } from '@playwright/test';
import { login, logout } from './helpers/auth';

test.describe('Logout', () => {
  test('deve realizar logout e redirecionar para login', async ({ page }) => {
    await login(page, 'ADMIN');
    await expect(page).toHaveURL('/admin');

    await logout(page);
    await expect(page).toHaveURL('/login');

    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('deve impedir acesso a rotas protegidas sem autenticação', async ({ page }) => {
    // Sessao limpa, sem login.
    await page.goto('/admin');
    await expect(page).toHaveURL('/login');

    await page.goto('/atendente');
    await expect(page).toHaveURL('/login');

    await page.goto('/cozinha');
    await expect(page).toHaveURL('/login');
  });

  test('não deve permitir acesso a /admin após logout mesmo navegando direto pela URL', async ({ page }) => {
    await login(page, 'ADMIN');
    await logout(page);

    await page.goto('/admin');
    await expect(page).toHaveURL('/login');
  });
});