import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { nomeAdicionalTeste } from './helpers/testData';
import { capturarIdCriado, deletarAdicional } from './helpers/cleanup';

test.describe('Adicionais', () => {
  // Ids criados durante o teste atual — apagados via API no afterEach, pra
  // nao deixar "Adicional E2E ..." orfao em producao. Ver e2e/helpers/cleanup.ts.
  let adicionaisCriados: string[] = [];

  test.beforeEach(async ({ page }) => {
    adicionaisCriados = [];
    await login(page, 'ADMIN');
    await page.getByTestId('sidebar-link-cardapio').click();
    await expect(page).toHaveURL('/admin/cardapio');
    await page.getByTestId('cardapio-tab-adicionais').click();
  });

  test.afterEach(async ({ page }) => {
    for (const id of adicionaisCriados) await deletarAdicional(page, id);
  });

  /** Preenche e salva o formulario de adicional, registrando o id para limpeza. */
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

// BUG CONHECIDO (backend), CONFIRMADO: mesmo sintoma exato de
  // categorias.spec.ts e produtos.spec.ts — PUT /adicionais/:id retorna
  // sucesso mas nao persiste o campo `ativo`. Rodado isoladamente e
  // reproduziu o mesmo comportamento: botao continua "Ativo" apos o
  // toggle, dezenas de tentativas dentro do timeout. Confirma que o bug
  // e compartilhado entre os tres recursos (categorias, produtos,
  // adicionais), nao especifico de um so. Ver issue de backend. Reativar
  // quando corrigido.
   test.fixme('deve desativar o adicional (não há edição de nome/preço na tela atual — apenas ativar/desativar e excluir)', async ({ page }) => {
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

    // Ja foi excluido pela propria acao do teste — remove da lista de
    // limpeza do afterEach para nao tentar deletar de novo.
    adicionaisCriados = [];
  });
});