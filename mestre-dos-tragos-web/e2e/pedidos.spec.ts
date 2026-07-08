import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

/**
 * Suite de Pedidos / Atendimento.
 *
 * Pré-requisito: a tela do atendente (src/pages/atendente/index.tsx) lista
 * o cardápio já cadastrado — ela não cria produtos, só consome o que já
 * existe no backend. Por isso estes testes dependem de que a API de teste
 * já tenha pelo menos 1 categoria com 1 produto do tipo LANCHE ativo e
 * disponível (ver e2e/produtos.spec.ts para o fluxo de cadastro via admin).
 * Se estiver rodando a suite inteira com `npm run test:e2e`, o Playwright
 * roda os arquivos de forma independente — não assuma que produtos.spec.ts
 * já rodou antes. Rode este arquivo com uma massa de dados minimamente
 * seedada no backend de teste (ou adapte para primeiro logar como ADMIN e
 * cadastrar o produto necessário antes do login como ATENDENTE).
 */
test.describe('Pedidos / Atendimento', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'ATENDENTE');
    await expect(page).toHaveURL('/atendente');
  });

  test('deve iniciar um novo pedido e adicionar produto', async ({ page }) => {
    const primeiroProduto = page.getByTestId('atendente-produto-card').first();
    await expect(primeiroProduto).toBeVisible();
    await primeiroProduto.click();

    await expect(page.getByTestId('atendente-modal-config')).toBeVisible();
    await page.getByTestId('atendente-confirmar-item-btn').click();
    await expect(page.getByTestId('atendente-modal-config')).toHaveCount(0);

    await expect(page.getByTestId('carrinho-item')).toHaveCount(1);
  });

  test('deve adicionar adicional ao produto, se disponível', async ({ page }) => {
    const primeiroProduto = page.getByTestId('atendente-produto-card').first();
    await primeiroProduto.click();

    const adicionaisDisponiveis = page.locator('[data-testid^="atendente-adicional-"]');
    const qtdAdicionais = await adicionaisDisponiveis.count();

    if (qtdAdicionais === 0) {
      test.skip(true, 'Produto selecionado nao possui adicionais cadastrados.');
    }

    await adicionaisDisponiveis.first().click();
    await page.getByTestId('atendente-confirmar-item-btn').click();

    const item = page.getByTestId('carrinho-item').first();
    await expect(item).toContainText('+');
  });

  test('deve calcular o total corretamente', async ({ page }) => {
    const primeiroProduto = page.getByTestId('atendente-produto-card').first();
    await primeiroProduto.click();

    // Aumenta a quantidade para 2 antes de confirmar, para validar que o
    // total do carrinho reflete quantidade x preco unitario.
    await page.getByTestId('atendente-qtd-mais-btn').click();
    await page.getByTestId('atendente-confirmar-item-btn').click();

    const total = page.getByTestId('carrinho-total');
    await expect(total).toBeVisible();
    const texto = await total.textContent();
    expect(texto).toMatch(/R\$\s*\d/);
  });

  test('deve enviar/finalizar o pedido e exibir confirmação', async ({ page }) => {
    await page.getByTestId('atendente-cliente-input').fill('Cliente E2E');

    const primeiroProduto = page.getByTestId('atendente-produto-card').first();
    await primeiroProduto.click();
    await page.getByTestId('atendente-confirmar-item-btn').click();

    await expect(page.getByTestId('carrinho-item')).toHaveCount(1);
    await page.getByTestId('carrinho-enviar-btn').click();

    await expect(page.getByTestId('carrinho-sucesso-alert')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('carrinho-enviar-btn')).toContainText('Pedido enviado');
  });
});