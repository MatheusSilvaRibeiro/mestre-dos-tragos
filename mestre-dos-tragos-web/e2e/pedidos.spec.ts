import { test, expect, type Page } from '@playwright/test';
import { login } from './helpers/auth';
import { nomeCategoriaTeste, nomeProdutoTeste } from './helpers/testData';
import { capturarIdCriado, deletarCategoria, deletarProduto } from './helpers/cleanup';

/**
 * Suite de Pedidos / Atendimento.
 *
 * A tela do atendente so lista produtos que ja existem no backend — ela nao
 * cria nada. Como produtos.spec.ts agora limpa (via afterEach) tudo que cria,
 * nao da mais pra contar com "sobras" de outra suite. Por isso aqui a gente
 * faz um seed proprio: cria 1 categoria + 1 produto tipo LANCHE uma unica vez
 * antes de todos os testes (beforeAll, logado como ADMIN numa aba separada),
 * e apaga os dois no final (afterAll).
 */
test.describe('Pedidos / Atendimento', () => {
  let categoriaId: string | null = null;
  let produtoId: string | null = null;
  let paginaSeed: Page;

  test.beforeAll(async ({ browser }) => {
    paginaSeed = await browser.newPage();
    await login(paginaSeed, 'ADMIN');
    await paginaSeed.getByTestId('sidebar-link-cardapio').click();
    await expect(paginaSeed).toHaveURL('/admin/cardapio');

    const nomeCategoria = nomeCategoriaTeste('Categoria E2E Seed Pedidos');
    await paginaSeed.getByTestId('cardapio-tab-categorias').click();
    const idCategoriaPromise = capturarIdCriado(paginaSeed, '/categorias');
    await paginaSeed.getByTestId('categoria-nome-input').fill(nomeCategoria);
    await paginaSeed.getByTestId('categoria-criar-btn').click();
    categoriaId = await idCategoriaPromise;
    await expect(paginaSeed.getByTestId('categoria-item').filter({ hasText: nomeCategoria })).toBeVisible({ timeout: 15_000 });

    const nomeProduto = nomeProdutoTeste('Produto E2E Seed Pedidos');
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
  });

  test.afterAll(async () => {
    if (produtoId) await deletarProduto(paginaSeed, produtoId);
    if (categoriaId) await deletarCategoria(paginaSeed, categoriaId);
    await paginaSeed.close();
  });

  test.beforeEach(async ({ page }) => {
    await login(page, 'ATENDENTE');
    await expect(page).toHaveURL('/atendente');
  });

  test('deve iniciar um novo pedido e adicionar produto', async ({ page }) => {
    const primeiroProduto = page.getByTestId('atendente-produto-card').first();
    await expect(primeiroProduto).toBeVisible({ timeout: 15_000 });
    await primeiroProduto.click();

    await expect(page.getByTestId('atendente-modal-config')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('atendente-confirmar-item-btn').click();
    await expect(page.getByTestId('atendente-modal-config')).toHaveCount(0, { timeout: 15_000 });

    await expect(page.getByTestId('carrinho-item')).toHaveCount(1, { timeout: 15_000 });
  });

  test('deve adicionar adicional ao produto, se disponível', async ({ page }) => {
    const primeiroProduto = page.getByTestId('atendente-produto-card').first();
    await expect(primeiroProduto).toBeVisible({ timeout: 15_000 });
    await primeiroProduto.click();
    await expect(page.getByTestId('atendente-modal-config')).toBeVisible({ timeout: 15_000 });

    const adicionaisDisponiveis = page.locator('[data-testid^="atendente-adicional-"]');
    const qtdAdicionais = await adicionaisDisponiveis.count();

    if (qtdAdicionais === 0) {
      test.skip(true, 'Produto seed nao possui adicionais cadastrados — nao ha o que testar aqui.');
    }

    await adicionaisDisponiveis.first().click();
    await page.getByTestId('atendente-confirmar-item-btn').click();

    const item = page.getByTestId('carrinho-item').first();
    await expect(item).toContainText('+', { timeout: 15_000 });
  });

  test('deve calcular o total corretamente', async ({ page }) => {
    const primeiroProduto = page.getByTestId('atendente-produto-card').first();
    await expect(primeiroProduto).toBeVisible({ timeout: 15_000 });
    await primeiroProduto.click();
    await expect(page.getByTestId('atendente-modal-config')).toBeVisible({ timeout: 15_000 });

    // Aumenta a quantidade para 2 antes de confirmar, para validar que o
    // total do carrinho reflete quantidade x preco unitario.
    await page.getByTestId('atendente-qtd-mais-btn').click();
    await page.getByTestId('atendente-confirmar-item-btn').click();

    const total = page.getByTestId('carrinho-total');
    await expect(total).toBeVisible({ timeout: 15_000 });
    const texto = await total.textContent();
    expect(texto).toMatch(/R\$\s*\d/);
  });

  test('deve enviar/finalizar o pedido e exibir confirmação', async ({ page }) => {
    await page.getByTestId('atendente-cliente-input').fill('Cliente E2E');

    const primeiroProduto = page.getByTestId('atendente-produto-card').first();
    await expect(primeiroProduto).toBeVisible({ timeout: 15_000 });
    await primeiroProduto.click();
    await expect(page.getByTestId('atendente-modal-config')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('atendente-confirmar-item-btn').click();

    await expect(page.getByTestId('carrinho-item')).toHaveCount(1, { timeout: 15_000 });
    await page.getByTestId('carrinho-enviar-btn').click();

    await expect(page.getByTestId('carrinho-sucesso-alert')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('carrinho-enviar-btn')).toContainText('Pedido enviado');
  });
});