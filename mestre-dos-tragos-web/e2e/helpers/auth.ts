import { expect, type Page } from '@playwright/test';
import { credenciaisAdmin, credenciaisAtendente, credenciaisCozinha, type Credenciais } from './testData';

export type Role = 'ADMIN' | 'ATENDENTE' | 'COZINHA';

/**
 * Mapa de "URL final esperada apos login" por role.
 *
 * Atencao a peculiaridade do fluxo de ADMIN: em src/pages/login.tsx, apos
 * autenticar como ADMIN a aplicacao navega para "/selecionar", rota que
 * NAO existe em src/App.tsx. O catch-all ("*") redireciona entao para "/"
 * (Splash), que por sua vez aguarda ~1.8s e so ai redireciona para
 * "/admin" (ja que o usuario esta autenticado). Ou seja: o login de ADMIN
 * funciona, mas passa por um salto extra e uma espera perceptivel.
 * Isso NAO e um comportamento intencional aparente — vale reportar como
 * um bug de roteamento para quem mantem o frontend. Os testes abaixo
 * assumem esse comportamento atual e usam timeout maior para o ADMIN.
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