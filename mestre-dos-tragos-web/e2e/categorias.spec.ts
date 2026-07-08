import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { nomeCategoriaTeste } from './helpers/testData';
import { capturarIdCriado, deletarCategoria } from './helpers/cleanup';

test.describe('Categorias', () => {
  // Ids criados durante o teste atual — apagados via API no afterEach, pra
  // nao deixar "Categoria E2E ..." orfa em producao. Ver e2e/helpers/cleanup.ts.
  let categoriasCriadas: string[] = [];

  test.beforeEach(async ({ page }) => {
    categoriasCriadas = [];
    await login(page, 'ADMIN');
    await page.getByTestId('sidebar-link-cardapio').click();
    await expect(page).toHaveURL('/admin/cardapio');
    await page.getByTestId('cardapio-tab-categorias').click();
  });

  test.afterEach(async ({ page }) => {
    for (const id of categoriasCriadas) await deletarCategoria(page, id);
  });

  /** Preenche e salva o formulario de categoria, registrando o id para limpeza. */
  async function criarCategoria(page: import('@playwright/test').Page, nome: string) {
    const idPromise = capturarIdCriado(page, '/categorias');
    await page.getByTestId('categoria-nome-input').fill(nome);
    await page.getByTestId('categoria-criar-btn').click();
    const id = await idPromise;
    if (id) categoriasCriadas.push(id);
  }

  test('deve cadastrar uma nova categoria', async ({ page }) => {
    const nome = nomeCategoriaTeste();

    await criarCategoria(page, nome);

    // salvarCategoria() faz POST + recarrega a lista inteira (3 GETs em
    // sequencia) antes do novo item aparecer — timeout generoso por causa
    // disso e de possivel cold start da API no Render.
    const item = page.getByTestId('categoria-item').filter({ hasText: nome });
    await expect(item).toBeVisible({ timeout: 15_000 });
  });

  test('deve listar a categoria criada', async ({ page }) => {
    const nome = nomeCategoriaTeste();

    await criarCategoria(page, nome);
    await expect(page.getByTestId('categoria-item').filter({ hasText: nome })).toBeVisible({ timeout: 15_000 });

    // Recarrega a lista do zero (nova navegacao) para confirmar que a
    // categoria foi persistida no backend, e nao so no estado local.
    await page.reload();
    await page.getByTestId('cardapio-tab-categorias').click();
    await expect(page.getByTestId('categoria-item').filter({ hasText: nome })).toBeVisible({ timeout: 15_000 });
  });

  // BUG CONHECIDO (backend): PUT /categorias/:id retorna 200 mas nao persiste
  // o campo `ativo`. Confirmado via diagnostico (log da resposta da API abaixo)
  // rodando contra a API real em producao. Nao e problema deste teste nem do
  // frontend — o botao "Ativo/Inativo" reflete corretamente o que a API retorna
  // no reload, mas a API simplesmente nao esta salvando a mudanca. O mesmo
  // padrao foi observado em produtos.spec.ts, entao suspeita-se de causa
  // compartilhada no backend. Ver issue separada de backend. Reativar quando
  // corrigido.
  test.fixme('deve desativar a categoria (o sistema atual não tem edição de nome — apenas ativar/desativar e excluir)', async ({ page }) => {
    const nome = nomeCategoriaTeste();

    await criarCategoria(page, nome);

    const item = page.getByTestId('categoria-item').filter({ hasText: nome });
    await expect(item).toBeVisible({ timeout: 15_000 });
    await expect(item.getByTestId('categoria-item-toggle')).toHaveText('Ativo', { timeout: 15_000 });

    // DIAGNOSTICO: capturamos a resposta real da API e qualquer dialog que
    // apareca (o catch() do toggleCategoria() dispara um alert() em caso de
    // erro, que o Playwright dispensa sozinho sem travar o teste — por isso
    // o problema parecia "so lento" antes de investigar com isso aqui).
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

    await criarCategoria(page, nome);

    const item = page.getByTestId('categoria-item').filter({ hasText: nome });
    await expect(item).toBeVisible({ timeout: 15_000 });

    // O app usa window.confirm() antes de deletar — precisamos aceitar o dialog.
    page.once('dialog', (dialog) => dialog.accept());
    await item.getByTestId('categoria-item-deletar').click();

    await expect(page.getByTestId('categoria-item').filter({ hasText: nome })).toHaveCount(0, { timeout: 15_000 });

    // Ja foi excluida pela propria acao do teste — remove da lista de
    // limpeza do afterEach para nao tentar deletar de novo.
    categoriasCriadas = [];
  });
});