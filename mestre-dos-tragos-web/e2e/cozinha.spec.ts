import { test, expect, type Page } from '@playwright/test';
import { ADMIN_STORAGE_STATE, ATENDENTE_STORAGE_STATE, COZINHA_STORAGE_STATE } from './helpers/storageState';
import { nomeCategoriaTeste, nomeProdutoTeste } from './helpers/testData';
import { capturarIdCriado, deletarCategoria, deletarProduto } from './helpers/cleanup';

/**
 * Suite da Cozinha.
 *
 * Tem seed proprio: cria categoria + produto (sessao de ADMIN pre-carregada)
 * e envia um pedido de verdade (sessao de ATENDENTE pre-carregada), tudo
 * isso uma unica vez em beforeAll — assim esta suite nao depende de
 * nenhuma outra ter rodado antes, e pode ser executada isoladamente ou em
 * paralelo sem problema. Ver e2e/helpers/storageState.ts.
 */
test.describe('Cozinha', () => {
  // Sessao de COZINHA pre-carregada para os testes em si.
  test.use({ storageState: COZINHA_STORAGE_STATE });

  let categoriaId: string | null = null;
  let produtoId: string | null = null;
  let paginaAdmin: Page;

  test.beforeAll(async ({ browser }) => {
    // 1. Cria categoria + produto — contexto separado com sessao de ADMIN.
    const contextoAdmin = await browser.newContext({ storageState: ADMIN_STORAGE_STATE });
    paginaAdmin = await contextoAdmin.newPage();

    await paginaAdmin.goto('/admin/cardapio');
    await expect(paginaAdmin).toHaveURL('/admin/cardapio');

    const nomeCategoria = nomeCategoriaTeste('Categoria E2E Seed Cozinha');
    await paginaAdmin.getByTestId('cardapio-tab-categorias').click();
    const idCategoriaPromise = capturarIdCriado(paginaAdmin, '/categorias');
    await paginaAdmin.getByTestId('categoria-nome-input').fill(nomeCategoria);
    await paginaAdmin.getByTestId('categoria-criar-btn').click();
    categoriaId = await idCategoriaPromise;
    await expect(paginaAdmin.getByTestId('categoria-item').filter({ hasText: nomeCategoria })).toBeVisible({ timeout: 15_000 });

    const nomeProduto = nomeProdutoTeste('Produto E2E Seed Cozinha');
    await paginaAdmin.getByTestId('cardapio-tab-produtos').click();
    await paginaAdmin.getByTestId('produto-novo-btn').click();
    await paginaAdmin.getByTestId('produto-tipo-LANCHE').click();
    await paginaAdmin.getByTestId('produto-nome-input').fill(nomeProduto);
    await paginaAdmin.getByTestId('produto-preco-input').fill('9.90');
    await paginaAdmin.getByTestId('produto-categoria-select').selectOption({ label: nomeCategoria });
    const idProdutoPromise = capturarIdCriado(paginaAdmin, '/produtos');
    await paginaAdmin.getByTestId('produto-salvar-btn').click();
    produtoId = await idProdutoPromise;
    await expect(paginaAdmin.getByTestId('produto-modal')).toHaveCount(0, { timeout: 15_000 });

    // 2. Envia um pedido real com esse produto — contexto separado com
    // sessao de ATENDENTE, pra existir algo PENDENTE quando os testes rodarem.
    const contextoAtendente = await browser.newContext({ storageState: ATENDENTE_STORAGE_STATE });
    const paginaAtendente = await contextoAtendente.newPage();

    await paginaAtendente.goto('/atendente');
    await paginaAtendente.getByTestId('atendente-busca-input').fill(nomeProduto);
    const cardSeed = paginaAtendente.getByTestId('atendente-produto-card').filter({ hasText: nomeProduto });
    await expect(cardSeed).toBeVisible({ timeout: 15_000 });
    await cardSeed.click();
    await expect(paginaAtendente.getByTestId('atendente-modal-config')).toBeVisible({ timeout: 15_000 });
    await paginaAtendente.getByTestId('atendente-confirmar-item-btn').click();
    await paginaAtendente.getByTestId('carrinho-enviar-btn').click();
    await expect(paginaAtendente.getByTestId('carrinho-sucesso-alert')).toBeVisible({ timeout: 30_000 });

    await paginaAtendente.close();
  });

  test.afterAll(async () => {
    // O pedido criado no seed e consumido pelo proprio fluxo dos testes
    // (aceitar -> em preparo -> finalizar -> some da fila ativa). Categoria
    // e produto de seed, por sua vez, precisam de limpeza explicita.
    if (produtoId) await deletarProduto(paginaAdmin, produtoId);
    if (categoriaId) await deletarCategoria(paginaAdmin, categoriaId);
    await paginaAdmin.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/cozinha');
    await expect(page).toHaveURL('/cozinha');
  });

  test('deve acessar a tela da cozinha', async ({ page }) => {
    await expect(page.getByTestId('cozinha-loading')).toHaveCount(0, { timeout: 15_000 });
    // getByRole (nao getByText) porque o nome do produto seed contem a
    // palavra "Cozinha" e aparece no card do pedido — getByText('Cozinha')
    // batia em dois elementos (o <h1> e o item do pedido) e quebrava com
    // strict mode violation.
    await expect(page.getByRole('heading', { name: 'Cozinha' })).toBeVisible({ timeout: 15_000 });
  });

  test('deve listar pedidos pendentes', async ({ page }) => {
    await expect(page.getByTestId('cozinha-loading')).toHaveCount(0, { timeout: 15_000 });

    const coluna = page.getByTestId('cozinha-coluna-pendentes');
    await expect(coluna).toBeVisible({ timeout: 15_000 });
  });

  test('deve alterar status do pedido para EM_PREPARO', async ({ page }) => {
    await expect(page.getByTestId('cozinha-loading')).toHaveCount(0, { timeout: 15_000 });

    const cardPendente = page
      .getByTestId('cozinha-coluna-pendentes')
      .getByTestId('cozinha-pedido-card')
      .first();

    if ((await cardPendente.count()) === 0) {
      test.skip(true, 'Nenhum pedido pendente no momento da execução.');
    }

    const idPedido = await cardPendente.getAttribute('data-pedido-id');
    await cardPendente.getByTestId('cozinha-aceitar-btn').click();

    // O pedido some da coluna de pendentes e passa a aparecer em "Em Preparo".
    await expect(page.getByTestId('cozinha-coluna-pendentes').locator(`[data-pedido-id="${idPedido}"]`)).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByTestId('cozinha-coluna-em-preparo').locator(`[data-pedido-id="${idPedido}"]`)).toBeVisible({ timeout: 15_000 });
  });

  test('deve alterar status do pedido para PRONTO e refletir visualmente', async ({ page }) => {
    await expect(page.getByTestId('cozinha-loading')).toHaveCount(0, { timeout: 15_000 });

    const cardEmPreparo = page
      .getByTestId('cozinha-coluna-em-preparo')
      .getByTestId('cozinha-pedido-card')
      .first();

    if ((await cardEmPreparo.count()) === 0) {
      test.skip(true, 'Nenhum pedido em preparo no momento da execução.');
    }

    const idPedido = await cardEmPreparo.getAttribute('data-pedido-id');
    await cardEmPreparo.getByTestId('cozinha-finalizar-btn').click();

    // Pedido PRONTO some das colunas ativas (a cozinha só lista PENDENTE/EM_PREPARO).
    await expect(page.locator(`[data-pedido-id="${idPedido}"]`)).toHaveCount(0, { timeout: 15_000 });
  });
});