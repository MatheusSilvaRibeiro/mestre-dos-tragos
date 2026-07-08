import type { Page } from '@playwright/test';

/**
 * cleanup.ts
 * -----------------------------------------------------------------------
 * Helpers para apagar, direto via API (sem passar pela UI), os registros
 * que os testes criam. Isso existe porque a suite roda contra a API real
 * de producao (nao ha staging/mocks configurados ainda — ver testData.ts),
 * e a maioria dos testes de criacao NAO tinha nenhuma limpeza depois de si,
 * deixando "Categoria E2E ...", "Produto E2E ..." e "Adicional E2E ..."
 * orfaos no banco a cada execucao.
 *
 * Isso ja causou um efeito colateral real: o teste "deve listar o produto
 * criado" comecou a falhar depois de rodarmos a suite algumas vezes, porque
 * a tela de cardapio busca produtos com `?limit=100` (sem filtro/paginacao
 * no frontend) — com dezenas de produtos de teste acumulados, o item recem
 * criado pode ficar fora dessa primeira pagina.
 *
 * IMPORTANTE: isso so evita NOVA sujeira a partir de agora. Os registros
 * ja criados em execucoes anteriores continuam no banco e precisam ser
 * limpos manualmente (via prisma studio, SQL direto, ou um endpoint
 * administrativo) — nao ha como o Playwright alcancar dados de execucoes
 * passadas.
 * -----------------------------------------------------------------------
 */

const API_BASE_URL = 'https://mestre-dos-tragos-api.onrender.com/api';

async function tokenAtual(page: Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem('token'));
}

async function deletar(page: Page, caminho: string) {
  const token = await tokenAtual(page);
  if (!token) return; // sem sessao ativa, nao ha o que limpar

  try {
    await page.request.delete(`${API_BASE_URL}${caminho}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Best-effort: se a limpeza falhar, nao derruba o teste por causa disso.
    // O registro fica orfao, mas isso ja seria o comportamento anterior.
  }
}

export async function deletarProduto(page: Page, id: string) {
  await deletar(page, `/produtos/${id}`);
}

export async function deletarCategoria(page: Page, id: string) {
  await deletar(page, `/categorias/${id}`);
}

export async function deletarAdicional(page: Page, id: string) {
  await deletar(page, `/adicionais/${id}`);
}

/**
 * Aguarda a resposta de um POST de criacao e retorna o id do registro criado.
 * Uso tipico: chamar isso ANTES do clique que dispara o POST, guardar a
 * promise, disparar o clique, depois dar await na promise.
 *
 * const idPromise = capturarIdCriado(page, '/produtos');
 * await page.getByTestId('produto-salvar-btn').click();
 * const id = await idPromise;
 */
export function capturarIdCriado(page: Page, caminho: string): Promise<string | null> {
  return page
    .waitForResponse(
      (res) => res.url().includes(caminho) && res.request().method() === 'POST',
      { timeout: 15_000 },
    )
    .then(async (res) => {
      try {
        const body = await res.json();
        return body?.id ?? body?.produto?.id ?? body?.categoria?.id ?? body?.adicional?.id ?? null;
      } catch {
        return null;
      }
    })
    .catch(() => null);
}