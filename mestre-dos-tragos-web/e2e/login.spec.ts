import { test, expect } from '@playwright/test';
import { login, preencherLogin, expectSessaoPersistida } from './helpers/auth';
import { credenciaisAdmin } from './helpers/testData';
import { ADMIN_STORAGE_STATE } from './helpers/storageState';

// Sessao de ADMIN pre-carregada (ver e2e/global-setup.ts). Nao interfere
// nos testes abaixo: /login sempre renderiza o formulario normalmente,
// esteja o usuario autenticado ou nao (nao ha redirect automatico dessa
// rota). Os testes que precisam validar o FLUXO de login de verdade
// ("credenciais invalidas" e "login valido") continuam fazendo login real
// pela UI, independente do que estiver pre-carregado.
test.use({ storageState: ADMIN_STORAGE_STATE });

test('deve carregar a aplicação', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/mestre-dos-tragos-web/i);
});

test.describe('Login', () => {
  test('deve carregar a tela de login', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('login-usuario-input')).toBeVisible();
    await expect(page.getByTestId('login-senha-input')).toBeVisible();
    await expect(page.getByTestId('login-submit-btn')).toBeVisible();
  });

  test('deve exibir erro ao tentar logar com usuário/senha inválidos', async ({ page }) => {
    await preencherLogin(page, 'usuario.inexistente', 'senha-errada-123');
    await page.getByTestId('login-submit-btn').click();

    // Timeout generoso: a API roda no Render free tier e pode demorar para
    // "acordar" (cold start) no primeiro request de cada execução.
    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 60_000 });
    // Continua na tela de login — nao deve navegar para nenhuma area do sistema.
    await expect(page).toHaveURL(/\/login$/);
  });

  test('deve fazer login com usuário válido e redirecionar para a área correta', async ({ page }) => {
    const { usuario, senha } = credenciaisAdmin();
    await login(page, 'ADMIN', { usuario, senha });

    await expect(page).toHaveURL('/admin');
    await expectSessaoPersistida(page);
  });

  test('deve persistir o usuário autenticado após recarregar a página', async ({ page }) => {
    // Sessao ja vem pre-carregada (storageState) — nao precisa logar de
    // novo, o que importa aqui e confirmar que o reload nao derruba a
    // sessao persistida em localStorage.
    await page.goto('/admin');
    await expect(page).toHaveURL('/admin');

    await page.reload();

    // ProtectedRoute aceita tanto o contexto quanto o localStorage como fonte
    // de verdade, justamente para sobreviver a um refresh antes do contexto
    // hidratar — entao o usuario deve permanecer em /admin, sem voltar pro login.
    // Timeout maior aqui tambem, pois o Dashboard dispara novas chamadas a API
    // assim que a pagina recarrega, e essas podem esbarrar no cold start.
    await expect(page).toHaveURL('/admin', { timeout: 30_000 });
    await expect(page.getByTestId('sidebar-user-role')).toHaveText('ADMIN');
  });
});