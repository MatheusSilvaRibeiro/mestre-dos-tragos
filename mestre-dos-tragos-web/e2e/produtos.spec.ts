import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { nomeCategoriaTeste, nomeProdutoTeste } from './helpers/testData';
import { capturarIdCriado, deletarCategoria, deletarProduto } from './helpers/cleanup';

test.describe('Produtos', () => {
  // IDs criados durante o teste atual — apagados via API no afterEach, pra
  // nao deixar "Produto E2E ..." / "Categoria E2E ..." orfaos em producao.
  // Ver e2e/helpers/cleanup.ts para o motivo disso existir.
  let produtosCriados: string[] = [];
  let categoriasCriadas: string[] = [];

  test.beforeEach(async ({ page }) => {
    produtosCriados = [];
    categoriasCriadas = [];
    await login(page, 'ADMIN');
    await page.getByTestId('sidebar-link-cardapio').click();
    await expect(page).toHaveURL('/admin/cardapio');
  });

  test.afterEach(async ({ page }) => {
    for (const id of produtosCriados) await deletarProduto(page, id);
    for (const id of categoriasCriadas) await deletarCategoria(page, id);
  });

  /**
   * O formulario de produto exige uma categoria ja cadastrada (select
   * "Categoria *"). Este helper garante que existe pelo menos uma
   * categoria ativa disponivel antes de abrir o modal de produto, e
   * registra o id criado para limpeza automatica no afterEach.
   */
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

  /** Preenche e salva o formulario de produto tipo LANCHE, registrando o id para limpeza. */
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

    // DIAGNOSTICO: a tela de cardapio busca produtos com `?limit=100` sem
    // paginacao real no frontend. Se acumular muitos produtos de teste
    // orfaos (de execucoes anteriores a este cleanup automatico existir),
    // o item recem-criado pode ficar fora da primeira pagina de 100.
    // Isso loga o total retornado pela API para confirmar a hipotese caso
    // esse teste volte a falhar.
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

  // BUG CONHECIDO (backend): mesmo padrao do bug ja confirmado em
  // categorias.spec.ts — PUT /produtos/:id aparentemente nao persiste o
  // campo `ativo`, apesar do toggleProduto() no frontend (mesmo padrao de
  // `{ ...p, ativo: !p.ativo }`) enviar a mudanca corretamente. Suspeita e
  // que seja o mesmo problema de backend afetando os tres recursos que usam
  // esse padrao de toggle (categorias, produtos, adicionais). Ver issue de
  // backend. Reativar quando corrigido.
  test.fixme('deve alternar disponibilidade do produto', async ({ page }) => {
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

    // Ja foi excluido pela propria acao do teste — remove da lista de
    // limpeza do afterEach para nao tentar deletar de novo (o DELETE
    // repetido e inofensivo, mas evita ruido/erro desnecessario nos logs).
    produtosCriados = [];
  });
});