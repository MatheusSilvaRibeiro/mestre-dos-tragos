import { test, expect } from '@playwright/test';
import { ADMIN_STORAGE_STATE } from './helpers/storageState';
import { nomeCategoriaTeste, nomeProdutoTeste } from './helpers/testData';
import { capturarIdCriado, deletarCategoria, deletarProduto } from './helpers/cleanup';

// Sessao de ADMIN pre-carregada (ver e2e/global-setup.ts) — sem login por
// teste, poupa o rate limit de login do backend.
test.use({ storageState: ADMIN_STORAGE_STATE });

test.describe('Produtos', () => {
  let produtosCriados: string[] = [];
  let categoriasCriadas: string[] = [];

  test.beforeEach(async ({ page }) => {
    produtosCriados = [];
    categoriasCriadas = [];
    await page.goto('/admin/cardapio');
  });

  test.afterEach(async ({ page }) => {
    for (const id of produtosCriados) await deletarProduto(page, id);
    for (const id of categoriasCriadas) await deletarCategoria(page, id);
  });

  async function garantirCategoria(page: import('@playwright/test').Page) {
    const nomeCategoria = nomeCategoriaTeste();
    await page.getByTestId('cardapio-tab-categorias').click();

    const idPromise = capturarIdCriado(page, '/categorias');
    await page.getByTestId('categoria-nome-input').fill(nomeCategoria);
    await page.getByTestId('categoria-criar-btn').click();
    const id = await idPromise;
    if (id) categoriasCriadas.push(id);

    await expect(page.getByTestId('categoria-item').filter({ hasText: nomeCategoria })).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('cardapio-tab-produtos').click();
    return nomeCategoria;
  }

  async function criarProdutoLanche(page: import('@playwright/test').Page, nome: string, categoria: string, preco: string) {
    await page.getByTestId('produto-novo-btn').click();
    await page.getByTestId('produto-tipo-LANCHE').click();
    await page.getByTestId('produto-nome-input').fill(nome);
    await page.getByTestId('produto-preco-input').fill(preco);
    await page.getByTestId('produto-categoria-select').selectOption({ label: categoria });

    const idPromise = capturarIdCriado(page, '/produtos');
    await page.getByTestId('produto-salvar-btn').click();
    const id = await idPromise;
    if (id) produtosCriados.push(id);
  }

  test('deve cadastrar um produto do tipo LANCHE', async ({ page }) => {
    const nomeCategoria = await garantirCategoria(page);
    const nomeProduto = nomeProdutoTeste();

    await page.getByTestId('produto-novo-btn').click();
    await expect(page.getByTestId('produto-modal')).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('produto-tipo-LANCHE').click();
    await page.getByTestId('produto-nome-input').fill(nomeProduto);
    await page.getByTestId('produto-preco-input').fill('19.90');
    await page.getByTestId('produto-categoria-select').selectOption({ label: nomeCategoria });

    const idPromise = capturarIdCriado(page, '/produtos');
    await page.getByTestId('produto-salvar-btn').click();
    const id = await idPromise;
    if (id) produtosCriados.push(id);

    await expect(page.getByTestId('produto-modal')).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByTestId('produto-item').filter({ hasText: nomeProduto })).toBeVisible({ timeout: 15_000 });
  });

  test('deve cadastrar produto com tamanhos (Batata Frita)', async ({ page }) => {
    const nomeCategoria = await garantirCategoria(page);
    const nomeProduto = nomeProdutoTeste('Batata E2E');

    await page.getByTestId('produto-novo-btn').click();
    await page.getByTestId('produto-tipo-BATATA_FRITA').click();
    await page.getByTestId('produto-nome-input').fill(nomeProduto);
    await page.getByTestId('produto-categoria-select').selectOption({ label: nomeCategoria });

    await page.getByTestId('produto-tamanho-add-btn').click();
    await page.getByTestId('produto-tamanho-nome-input').first().fill('P');
    await page.getByTestId('produto-tamanho-preco-input').first().fill('12.00');

    await page.getByTestId('produto-tamanho-add-btn').click();
    const nomesTamanho = page.getByTestId('produto-tamanho-nome-input');
    const precosTamanho = page.getByTestId('produto-tamanho-preco-input');
    await nomesTamanho.nth(1).fill('G');
    await precosTamanho.nth(1).fill('22.00');

    const idPromise = capturarIdCriado(page, '/produtos');
    await page.getByTestId('produto-salvar-btn').click();
    const id = await idPromise;
    if (id) produtosCriados.push(id);

    await expect(page.getByTestId('produto-modal')).toHaveCount(0, { timeout: 15_000 });

    const item = page.getByTestId('produto-item').filter({ hasText: nomeProduto });
    await expect(item).toBeVisible({ timeout: 15_000 });
    await expect(item).toContainText('2 tamanhos', { timeout: 15_000 });
  });

  test('deve listar o produto criado', async ({ page }) => {
    const nomeCategoria = await garantirCategoria(page);
    const nomeProduto = nomeProdutoTeste();

    await criarProdutoLanche(page, nomeProduto, nomeCategoria, '15.00');

    await page.reload();
    await page.getByTestId('cardapio-tab-produtos').click();

    const respostaPromise = page.waitForResponse(
      (res) => res.url().includes('/produtos') && res.request().method() === 'GET',
      { timeout: 15_000 },
    ).catch(() => null);

    const item = page.getByTestId('produto-item').filter({ hasText: nomeProduto });
    const visivel = await item.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!visivel) {
      const resposta = await respostaPromise;
      if (resposta) {
        const body = await resposta.json().catch(() => null);
        const total = body?.produtos?.length ?? body?.length ?? 'desconhecido';
        console.log(`[DIAGNOSTICO] GET /produtos retornou ${total} itens; produto "${nomeProduto}" nao estava entre eles.`);
      }
    }

    await expect(item).toBeVisible({ timeout: 15_000 });
  });

  test('deve editar nome/preço/disponibilidade do produto', async ({ page }) => {
    const nomeCategoria = await garantirCategoria(page);
    const nomeProduto = nomeProdutoTeste();
    const nomeEditado = `${nomeProduto} (editado)`;

    await criarProdutoLanche(page, nomeProduto, nomeCategoria, '10.00');

    const item = page.getByTestId('produto-item').filter({ hasText: nomeProduto });
    await expect(item).toBeVisible({ timeout: 15_000 });
    await item.getByTestId('produto-item-editar').click();

    await expect(page.getByTestId('produto-modal')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('produto-nome-input').fill(nomeEditado);
    await page.getByTestId('produto-preco-input').fill('25.50');
    await page.getByTestId('produto-salvar-btn').click();

    const itemEditado = page.getByTestId('produto-item').filter({ hasText: nomeEditado });
    await expect(itemEditado).toBeVisible({ timeout: 15_000 });
    await expect(itemEditado.getByTestId('produto-item-preco')).toContainText('25,50', { timeout: 15_000 });
  });

  test('deve alternar disponibilidade do produto', async ({ page }) => {
    const nomeCategoria = await garantirCategoria(page);
    const nomeProduto = nomeProdutoTeste();

    await criarProdutoLanche(page, nomeProduto, nomeCategoria, '10.00');

    const item = page.getByTestId('produto-item').filter({ hasText: nomeProduto });
    await expect(item.getByTestId('produto-item-toggle')).toHaveText('Ativo', { timeout: 15_000 });

    await item.getByTestId('produto-item-toggle').click();
    await expect(item.getByTestId('produto-item-toggle')).toHaveText('Inativo', { timeout: 15_000 });
  });

  test('deve excluir o produto', async ({ page }) => {
    const nomeCategoria = await garantirCategoria(page);
    const nomeProduto = nomeProdutoTeste();

    await criarProdutoLanche(page, nomeProduto, nomeCategoria, '10.00');

    const item = page.getByTestId('produto-item').filter({ hasText: nomeProduto });
    await expect(item).toBeVisible({ timeout: 15_000 });

    page.once('dialog', (dialog) => dialog.accept());
    await item.getByTestId('produto-item-deletar').click();

    await expect(page.getByTestId('produto-item').filter({ hasText: nomeProduto })).toHaveCount(0, { timeout: 15_000 });

    produtosCriados = [];
  });
});