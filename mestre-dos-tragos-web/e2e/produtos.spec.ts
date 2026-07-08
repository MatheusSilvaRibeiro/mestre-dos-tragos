import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { nomeCategoriaTeste, nomeProdutoTeste } from './helpers/testData';

test.describe('Produtos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'ADMIN');
    await page.getByTestId('sidebar-link-cardapio').click();
    await expect(page).toHaveURL('/admin/cardapio');
  });

  /**
   * O formulario de produto exige uma categoria ja cadastrada (select
   * "Categoria *"). Este helper garante que existe pelo menos uma
   * categoria ativa disponivel antes de abrir o modal de produto.
   */
  async function garantirCategoria(page: import('@playwright/test').Page) {
    const nomeCategoria = nomeCategoriaTeste();
    await page.getByTestId('cardapio-tab-categorias').click();
    await page.getByTestId('categoria-nome-input').fill(nomeCategoria);
    await page.getByTestId('categoria-criar-btn').click();
    await expect(page.getByTestId('categoria-item').filter({ hasText: nomeCategoria })).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('cardapio-tab-produtos').click();
    return nomeCategoria;
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

    await page.getByTestId('produto-salvar-btn').click();
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

    await page.getByTestId('produto-salvar-btn').click();
    await expect(page.getByTestId('produto-modal')).toHaveCount(0, { timeout: 15_000 });

    const item = page.getByTestId('produto-item').filter({ hasText: nomeProduto });
    await expect(item).toBeVisible({ timeout: 15_000 });
    await expect(item).toContainText('2 tamanhos', { timeout: 15_000 });
  });

  test('deve listar o produto criado', async ({ page }) => {
    const nomeCategoria = await garantirCategoria(page);
    const nomeProduto = nomeProdutoTeste();

    await page.getByTestId('produto-novo-btn').click();
    await page.getByTestId('produto-tipo-LANCHE').click();
    await page.getByTestId('produto-nome-input').fill(nomeProduto);
    await page.getByTestId('produto-preco-input').fill('15.00');
    await page.getByTestId('produto-categoria-select').selectOption({ label: nomeCategoria });
    await page.getByTestId('produto-salvar-btn').click();

    await page.reload();
    await page.getByTestId('cardapio-tab-produtos').click();
    await expect(page.getByTestId('produto-item').filter({ hasText: nomeProduto })).toBeVisible({ timeout: 15_000 });
  });

  test('deve editar nome/preço/disponibilidade do produto', async ({ page }) => {
    const nomeCategoria = await garantirCategoria(page);
    const nomeProduto = nomeProdutoTeste();
    const nomeEditado = `${nomeProduto} (editado)`;

    await page.getByTestId('produto-novo-btn').click();
    await page.getByTestId('produto-tipo-LANCHE').click();
    await page.getByTestId('produto-nome-input').fill(nomeProduto);
    await page.getByTestId('produto-preco-input').fill('10.00');
    await page.getByTestId('produto-categoria-select').selectOption({ label: nomeCategoria });
    await page.getByTestId('produto-salvar-btn').click();

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

    await page.getByTestId('produto-novo-btn').click();
    await page.getByTestId('produto-tipo-LANCHE').click();
    await page.getByTestId('produto-nome-input').fill(nomeProduto);
    await page.getByTestId('produto-preco-input').fill('10.00');
    await page.getByTestId('produto-categoria-select').selectOption({ label: nomeCategoria });
    await page.getByTestId('produto-salvar-btn').click();

    const item = page.getByTestId('produto-item').filter({ hasText: nomeProduto });
    await expect(item.getByTestId('produto-item-toggle')).toHaveText('Ativo', { timeout: 15_000 });

    await item.getByTestId('produto-item-toggle').click();
    await expect(item.getByTestId('produto-item-toggle')).toHaveText('Inativo', { timeout: 15_000 });
  });

  test('deve excluir o produto', async ({ page }) => {
    const nomeCategoria = await garantirCategoria(page);
    const nomeProduto = nomeProdutoTeste();

    await page.getByTestId('produto-novo-btn').click();
    await page.getByTestId('produto-tipo-LANCHE').click();
    await page.getByTestId('produto-nome-input').fill(nomeProduto);
    await page.getByTestId('produto-preco-input').fill('10.00');
    await page.getByTestId('produto-categoria-select').selectOption({ label: nomeCategoria });
    await page.getByTestId('produto-salvar-btn').click();

    const item = page.getByTestId('produto-item').filter({ hasText: nomeProduto });
    await expect(item).toBeVisible({ timeout: 15_000 });

    page.once('dialog', (dialog) => dialog.accept());
    await item.getByTestId('produto-item-deletar').click();

    await expect(page.getByTestId('produto-item').filter({ hasText: nomeProduto })).toHaveCount(0, { timeout: 15_000 });
  });
});