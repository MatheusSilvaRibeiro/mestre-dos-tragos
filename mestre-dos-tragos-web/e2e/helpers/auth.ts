import { expect, type Page } from '@playwright/test';
import { credenciaisAdmin, credenciaisAtendente, credenciaisCozinha, type Credenciais } from './testData';

export type Role = 'ADMIN' | 'ATENDENTE' | 'COZINHA';

/**
 * Mapa de "URL final esperada apos login" por role.
 *
 * HISTORICO: ate o commit que corrigiu fix/admin-login-redirect, o login de
 * ADMIN navegava para "/selecionar" (rota inexistente em App.tsx), caia no
 * catch-all "*" e so chegava em "/admin" apos um bounce via Splash (~1.8s).
 * Isso foi corrigido — login.tsx agora navega direto para "/admin". O
 * LOGIN_TIMEOUT abaixo continua generoso mesmo assim, por causa do cold
 * start da API no Render (ver comentario logo abaixo), nao por causa desse
 * bug antigo.
 */
const URL_POR_ROLE: Record<Role, string | RegExp> = {
  ADMIN: '/admin',
  ATENDENTE: '/atendente',
  COZINHA: '/cozinha',
};

/**
 * Tempo de espera apos o submit do login ate o redirecionamento acontecer.
 *
 * A API roda no plano free do Render, que "dorme" apos um periodo sem uso
 * e pode levar dezenas de segundos para responder ao primeiro request
 * (cold start). Esse tempo se soma a qualquer latencia normal de rede,
 * entao o timeout aqui precisa ser generoso — sem isso, os testes falham
 * por timing mesmo com credenciais corretas.
 */
const LOGIN_TIMEOUT = 60_000;

function credenciaisPorRole(role: Role): Credenciais {
  switch (role) {
    case 'ADMIN': return credenciaisAdmin();
    case 'ATENDENTE': return credenciaisAtendente();
    case 'COZINHA': return credenciaisCozinha();
  }
}

/** Preenche o formulario de login sem submeter. Util para o teste de credenciais invalidas. */
export async function preencherLogin(page: Page, usuario: string, senha: string) {
  await page.goto('/login');
  await page.getByTestId('login-usuario-input').fill(usuario);
  await page.getByTestId('login-senha-input').fill(senha);
}

/**
 * Faz login com um usuario da role informada (ou credenciais explicitas) e
 * aguarda o redirecionamento para a area correta do sistema.
 */
export async function login(page: Page, role: Role, credenciais?: Credenciais) {
  const { usuario, senha } = credenciais ?? credenciaisPorRole(role);

  await preencherLogin(page, usuario, senha);
  await page.getByTestId('login-submit-btn').click();

  await expect(page).toHaveURL(URL_POR_ROLE[role], { timeout: LOGIN_TIMEOUT });
}

export async function loginComoAdmin(page: Page, credenciais?: Credenciais) {
  await login(page, 'ADMIN', credenciais);
}

export async function loginComoAtendente(page: Page, credenciais?: Credenciais) {
  await login(page, 'ATENDENTE', credenciais);
}

export async function loginComoCozinha(page: Page, credenciais?: Credenciais) {
  await login(page, 'COZINHA', credenciais);
}

/** Faz logout a partir de qualquer tela do AdminLayout (sidebar) e confirma o redirecionamento. */
export async function logout(page: Page) {
  await page.getByTestId('logout-btn').click();
  await expect(page).toHaveURL('/login');
}

/** Verifica, via localStorage, que existe uma sessao autenticada persistida pelo AuthContext. */
export async function expectSessaoPersistida(page: Page) {
  const token = await page.evaluate(() => localStorage.getItem('token'));
  const funcionario = await page.evaluate(() => localStorage.getItem('funcionario'));
  expect(token).toBeTruthy();
  expect(funcionario).toBeTruthy();
}