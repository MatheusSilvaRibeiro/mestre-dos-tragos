import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { nomeCategoriaTeste } from './helpers/testData';

test.describe('Categorias', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'ADMIN');
    await page.getByTestId('sidebar-link-cardapio').click();
    await expect(page).toHaveURL('/admin/cardapio');
    await page.getByTestId('cardapio-tab-categorias').click();
  });

  test('deve cadastrar uma nova categoria', async ({ page }) => {
    const nome = nomeCategoriaTeste();

    await page.getByTestId('categoria-nome-input').fill(nome);
    await page.getByTestId('categoria-criar-btn').click();

    // salvarCategoria() faz POST + recarrega a lista inteira (3 GETs em
    // sequencia) antes do novo item aparecer — timeout generoso por causa
    // disso e de possivel cold start da API no Render.
    const item = page.getByTestId('categoria-item').filter({ hasText: nome });
    await expect(item).toBeVisible({ timeout: 15_000 });
  });

  test('deve listar a categoria criada', async ({ page }) => {
    const nome = nomeCategoriaTeste();

    await page.getByTestId('categoria-nome-input').fill(nome);
    await page.getByTestId('categoria-criar-btn').click();
    await expect(page.getByTestId('categoria-item').filter({ hasText: nome })).toBeVisible({ timeout: 15_000 });

    // Recarrega a lista do zero (nova navegacao) para confirmar que a
    // categoria foi persistida no backend, e nao so no estado local.
    await page.reload();
    await page.getByTestId('cardapio-tab-categorias').click();
    await expect(page.getByTestId('categoria-item').filter({ hasText: nome })).toBeVisible({ timeout: 15_000 });
  });

  test('deve desativar a categoria (o sistema atual não tem edição de nome — apenas ativar/desativar e excluir)', async ({ page }) => {
    const nome = nomeCategoriaTeste();

    await page.getByTestId('categoria-nome-input').fill(nome);
    await page.getByTestId('categoria-criar-btn').click();

    const item = page.getByTestId('categoria-item').filter({ hasText: nome });
    await expect(item).toBeVisible({ timeout: 15_000 });
    await expect(item.getByTestId('categoria-item-toggle')).toHaveText('Ativo', { timeout: 15_000 });

    // DIAGNOSTICO: se o botao nao mudar para "Inativo", o motivo mais provavel
    // e o PUT /categorias/:id falhando no backend (toggleCategoria() cai no
    // catch e mostra um alert(), que o Playwright dispensa sozinho sem travar
    // o teste — por isso o problema parecia "so lento" antes de investigar).
    // Capturamos aqui a resposta real da API e qualquer dialog para diagnosticar.
    page.on('dialog', (dialog) => {
      console.log(`[DIALOG] ${dialog.type()}: ${dialog.message()}`);
      dialog.accept();
    });

    const respostaPromise = page.waitForResponse(
      (res) => res.url().includes('/categorias/') && res.request().method() === 'PUT',
      { timeout: 15_000 },
    );

    await item.getByTestId('categoria-item-toggle').click();

    const resposta = await respostaPromise;
    console.log(`[PUT /categorias/:id] status=${resposta.status()}`);
    if (!resposta.ok()) {
      console.log(`[PUT /categorias/:id] body=${await resposta.text()}`);
    }
    expect(resposta.ok(), `PUT /categorias/:id retornou ${resposta.status()}`).toBeTruthy();

    await expect(item.getByTestId('categoria-item-toggle')).toHaveText('Inativo', { timeout: 15_000 });
  });

  test('deve excluir a categoria', async ({ page }) => {
    const nome = nomeCategoriaTeste();

    await page.getByTestId('categoria-nome-input').fill(nome);
    await page.getByTestId('categoria-criar-btn').click();

    const item = page.getByTestId('categoria-item').filter({ hasText: nome });
    await expect(item).toBeVisible({ timeout: 15_000 });

    // O app usa window.confirm() antes de deletar — precisamos aceitar o dialog.
    page.once('dialog', (dialog) => dialog.accept());
    await item.getByTestId('categoria-item-deletar').click();

    await expect(page.getByTestId('categoria-item').filter({ hasText: nome })).toHaveCount(0, { timeout: 15_000 });
  });
});