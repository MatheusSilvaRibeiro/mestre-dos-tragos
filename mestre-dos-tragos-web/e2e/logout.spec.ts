import { test, expect } from '@playwright/test';
import { logout } from './helpers/auth';
import { ADMIN_STORAGE_STATE } from './helpers/storageState';

test.describe('Logout', () => {
  // Sessao de ADMIN pre-carregada (ver e2e/global-setup.ts) — o que estes
  // dois testes validam e o LOGOUT, nao o login, entao nao precisam logar
  // de novo pela UI.
  test.describe('com sessao ativa', () => {
    test.use({ storageState: ADMIN_STORAGE_STATE });

    test('deve realizar logout e redirecionar para login', async ({ page }) => {
      await page.goto('/admin');
      await expect(page).toHaveURL('/admin');

      await logout(page);
      await expect(page).toHaveURL('/login');

      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeNull();
    });

    test('não deve permitir acesso a /admin após logout mesmo navegando direto pela URL', async ({ page }) => {
      await page.goto('/admin');
      await logout(page);

      await page.goto('/admin');
      await expect(page).toHaveURL('/login');
    });
  });

  // Este teste precisa mesmo de uma sessao vazia — sem storageState, o
  // contexto do Playwright ja nasce sem nenhuma sessao (comportamento
  // padrao), exatamente o que ele precisa.
  test('deve impedir acesso a rotas protegidas sem autenticação', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL('/login');

    await page.goto('/atendente');
    await expect(page).toHaveURL('/login');

    await page.goto('/cozinha');
    await expect(page).toHaveURL('/login');
  });
});