import { test, expect, type Page } from '@playwright/test';
import { login } from './helpers/auth';
import { nomeCategoriaTeste, nomeProdutoTeste } from './helpers/testData';
import { capturarIdCriado, deletarCategoria, deletarProduto } from './helpers/cleanup';

/**
 * Suite da Cozinha.
 *
 * IMPORTANTE: esta suite tinha uma dependencia implicita de pedidos.spec.ts
 * ja ter rodado antes (para existir um pedido PENDENTE). Isso funcionava
 * rodando os arquivos um de cada vez, mas quebrou ao rodar `npm run test:e2e`
 * sem filtro — o Playwright usa 4 workers em paralelo por padrao, entao
 * arquivos diferentes rodam ao mesmo tempo, sem ordem garantida entre eles.
 *
 * Corrigido criando um seed proprio aqui: cria categoria + produto (ADMIN),
 * loga como ATENDENTE e envia um pedido de verdade, tudo isso uma unica vez
 * em beforeAll — assim esta suite nao depende de nenhuma outra ter rodado
 * antes, e pode ser executada isoladamente ou em paralelo sem problema.
 */
test.describe('Cozinha', () => {
  let categoriaId: string | null = null;
  let produtoId: string | null = null;
  let paginaSeed: Page;

  test.beforeAll(async ({ browser }) => {
    paginaSeed = await browser.newPage();

    // 1. Cria categoria + produto como ADMIN.
    await login(paginaSeed, 'ADMIN');
    await paginaSeed.getByTestId('sidebar-link-cardapio').click();
    await expect(paginaSeed).toHaveURL('/admin/cardapio');

    const nomeCategoria = nomeCategoriaTeste('Categoria E2E Seed Cozinha');
    await paginaSeed.getByTestId('cardapio-tab-categorias').click();
    const idCategoriaPromise = capturarIdCriado(paginaSeed, '/categorias');
    await paginaSeed.getByTestId('categoria-nome-input').fill(nomeCategoria);
    await paginaSeed.getByTestId('categoria-criar-btn').click();
    categoriaId = await idCategoriaPromise;
    await expect(paginaSeed.getByTestId('categoria-item').filter({ hasText: nomeCategoria })).toBeVisible({ timeout: 15_000 });

    const nomeProduto = nomeProdutoTeste('Produto E2E Seed Cozinha');
    await paginaSeed.getByTestId('cardapio-tab-produtos').click();
    await paginaSeed.getByTestId('produto-novo-btn').click();
    await paginaSeed.getByTestId('produto-tipo-LANCHE').click();
    await paginaSeed.getByTestId('produto-nome-input').fill(nomeProduto);
    await paginaSeed.getByTestId('produto-preco-input').fill('9.90');
    await paginaSeed.getByTestId('produto-categoria-select').selectOption({ label: nomeCategoria });
    const idProdutoPromise = capturarIdCriado(paginaSeed, '/produtos');
    await paginaSeed.getByTestId('produto-salvar-btn').click();
    produtoId = await idProdutoPromise;
    await expect(paginaSeed.getByTestId('produto-modal')).toHaveCount(0, { timeout: 15_000 });

    // 2. Loga como ATENDENTE (login() faz goto('/login') + submit, sobrescreve
    // a sessao ADMIN sem precisar de logout explicito) e envia um pedido real
    // com esse produto, para existir algo PENDENTE quando os testes rodarem.
    await login(paginaSeed, 'ATENDENTE');
    await paginaSeed.getByTestId('atendente-busca-input').fill(nomeProduto);
    const cardSeed = paginaSeed.getByTestId('atendente-produto-card').filter({ hasText: nomeProduto });
    await expect(cardSeed).toBeVisible({ timeout: 15_000 });
    await cardSeed.click();
    await expect(paginaSeed.getByTestId('atendente-modal-config')).toBeVisible({ timeout: 15_000 });
    await paginaSeed.getByTestId('atendente-confirmar-item-btn').click();
    await paginaSeed.getByTestId('carrinho-enviar-btn').click();
    await expect(paginaSeed.getByTestId('carrinho-sucesso-alert')).toBeVisible({ timeout: 30_000 });
  });

  test.afterAll(async () => {
    // O pedido criado no seed e consumido pelo proprio fluxo dos testes
    // (aceitar -> em preparo -> finalizar -> some da fila ativa). Categoria
    // e produto de seed, por sua vez, precisam de limpeza explicita.
    if (produtoId) await deletarProduto(paginaSeed, produtoId);
    if (categoriaId) await deletarCategoria(paginaSeed, categoriaId);
    await paginaSeed.close();
  });

  test.beforeEach(async ({ page }) => {
    await login(page, 'COZINHA');
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