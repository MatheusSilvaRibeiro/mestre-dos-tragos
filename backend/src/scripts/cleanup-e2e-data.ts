/**
 * cleanup-e2e-data.ts
 * -----------------------------------------------------------------------
 * Apaga os registros orfaos deixados pela suite E2E antes do cleanup
 * automatico (e2e/helpers/cleanup.ts) existir no frontend.
 *
 * SEGURANCA:
 * - Por padrao roda em modo DRY-RUN: mostra o que SERIA apagado, mas nao
 *   apaga nada de verdade.
 * - So apaga de fato se voce passar a flag --confirmar.
 * - Usa exatamente os mesmos filtros de prefixo do check-e2e-prefixes.ts
 *   (rode aquele script de novo logo antes deste, pra conferir a lista
 *   uma ultima vez — pode ter mudado algo entre uma execucao e outra).
 * - Apaga PEDIDOS DE TESTE primeiro (desbloqueia a FK), depois PRODUTOS,
 *   depois CATEGORIAS. Adicionais nao tem relacao de FK, vai primeiro.
 *
 * Como rodar (dentro da pasta backend/):
 *   npx tsx scripts/cleanup-e2e-data.ts                → dry-run (nao apaga nada)
 *   npx tsx scripts/cleanup-e2e-data.ts --confirmar     → apaga de verdade
 * -----------------------------------------------------------------------
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PREFIXOS = {
  categoria: 'Categoria E2E',
  produto: 'Produto E2E',
  adicional: 'Adicional E2E',
};

const CONFIRMAR = process.argv.includes('--confirmar');

async function main() {
  console.log(CONFIRMAR ? '⚠️  MODO EXECUCAO — vai apagar de verdade!\n' : 'ℹ️  MODO DRY-RUN — nada sera apagado. Rode com --confirmar para executar de verdade.\n');

  // ─────────────────────────────────────────────────────────
  // 1. ADICIONAIS — sem FK, pode ir primeiro
  // ─────────────────────────────────────────────────────────
  const adicionais = await prisma.adicional.findMany({
    where: { nome: { startsWith: PREFIXOS.adicional } },
    select: { id: true, nome: true },
  });
  console.log(`Adicionais encontrados: ${adicionais.length}`);
  adicionais.forEach((a) => console.log(`  [${a.id}] "${a.nome}"`));

  if (CONFIRMAR && adicionais.length > 0) {
    const resultado = await prisma.adicional.deleteMany({
      where: { id: { in: adicionais.map((a) => a.id) } },
    });
    console.log(`  → ${resultado.count} adicionais apagados.\n`);
  } else {
    console.log('  → (dry-run, nada apagado)\n');
  }

  // ─────────────────────────────────────────────────────────
  // 1.5. PEDIDOS DE TESTE — os testes de pedidos.spec.ts / cozinha.spec.ts
  // criam pedidos DE VERDADE (tabela itens_pedido) usando os produtos de
  // seed. Isso bloqueia o delete do produto por FK
  // (itens_pedido_produtoId_fkey) se nao for limpo antes. So existem
  // porque referenciam um produto de teste — nenhum pedido real usaria
  // um produtoId que so existe nesta lista.
  // ─────────────────────────────────────────────────────────
  const produtosParaApagar = await prisma.produto.findMany({
    where: {
      OR: [
        { nome: { startsWith: PREFIXOS.produto } },
        { nome: { startsWith: 'Batata E2E' } },
      ],
    },
    select: { id: true, nome: true },
  });
  const produtoIdsPreview = produtosParaApagar.map((p) => p.id);

  const itensPedido = await prisma.itemPedido.findMany({
    where: { produtoId: { in: produtoIdsPreview } },
    select: { id: true, pedidoId: true },
  });
  const pedidoIds = [...new Set(itensPedido.map((i) => i.pedidoId))];
  const itemPedidoIds = itensPedido.map((i) => i.id);

  console.log(`Pedidos de teste encontrados (via produto): ${pedidoIds.length}`);
  if (pedidoIds.length > 0) {
    const pedidos = await prisma.pedido.findMany({
      where: { id: { in: pedidoIds } },
      select: { id: true, nomeCliente: true },
    });
    pedidos.forEach((p) => console.log(`  [${p.id}] cliente="${p.nomeCliente}"`));
  }

  if (CONFIRMAR && itemPedidoIds.length > 0) {
    await prisma.itemPedidoAdicional.deleteMany({ where: { itemPedidoId: { in: itemPedidoIds } } }).catch((e) => {
      console.warn('  ⚠️  Nao foi possivel apagar "itemPedidoAdicional":', e.message);
    });
    await prisma.itemPedidoSabor.deleteMany({ where: { itemPedidoId: { in: itemPedidoIds } } }).catch((e) => {
      console.warn('  ⚠️  Nao foi possivel apagar "itemPedidoSabor":', e.message);
    });
    await prisma.itemPedido.deleteMany({ where: { id: { in: itemPedidoIds } } });
    const resultadoPedidos = await prisma.pedido.deleteMany({ where: { id: { in: pedidoIds } } });
    console.log(`  → ${resultadoPedidos.count} pedidos de teste apagados.\n`);
  } else {
    console.log('  → (dry-run, nada apagado)\n');
  }

  // ─────────────────────────────────────────────────────────
  // 2. PRODUTOS — tem FK para categoria, apaga ANTES da categoria
  // (reaproveita produtosParaApagar da etapa 1.5, mesma consulta)
  // ─────────────────────────────────────────────────────────
  const produtos = produtosParaApagar;
  console.log(`Produtos encontrados: ${produtos.length}`);
  produtos.forEach((p) => console.log(`  [${p.id}] "${p.nome}"`));

  if (CONFIRMAR && produtos.length > 0) {
    // Produto tem tabelas filhas (ProdutoTamanho, ProdutoAdicional) — apaga
    // essas relacoes primeiro pra nao esbarrar em constraint de FK.
    const produtoIds = produtos.map((p) => p.id);
    await prisma.produtoTamanho.deleteMany({ where: { produtoId: { in: produtoIds } } }).catch((e) => {
      console.warn('  ⚠️  Nao foi possivel apagar "produtoTamanho" separadamente:', e.message);
    });
    await prisma.produtoAdicional.deleteMany({ where: { produtoId: { in: produtoIds } } }).catch((e) => {
      console.warn('  ⚠️  Nao foi possivel apagar "produtoAdicional" separadamente:', e.message);
    });

    const resultado = await prisma.produto.deleteMany({
      where: { id: { in: produtoIds } },
    });
    console.log(`  → ${resultado.count} produtos apagados.\n`);
  } else {
    console.log('  → (dry-run, nada apagado)\n');
  }

  // ─────────────────────────────────────────────────────────
  // 3. CATEGORIAS — por ultimo, depois que os produtos ja sumiram
  // ─────────────────────────────────────────────────────────
  const categorias = await prisma.categoria.findMany({
    where: { nome: { startsWith: PREFIXOS.categoria } },
    select: { id: true, nome: true },
  });
  console.log(`Categorias encontradas: ${categorias.length}`);
  categorias.forEach((c) => console.log(`  [${c.id}] "${c.nome}"`));

  if (CONFIRMAR && categorias.length > 0) {
    const resultado = await prisma.categoria.deleteMany({
      where: { id: { in: categorias.map((c) => c.id) } },
    });
    console.log(`  → ${resultado.count} categorias apagadas.\n`);
  } else {
    console.log('  → (dry-run, nada apagado)\n');
  }

  console.log('=== RESUMO ===');
  console.log(`Adicionais: ${adicionais.length} | Produtos: ${produtos.length} | Categorias: ${categorias.length}`);
  if (!CONFIRMAR) {
    console.log('\nNada foi apagado (dry-run). Revise a lista acima e, se estiver tudo');
    console.log('certo, rode de novo com: npx tsx scripts/cleanup-e2e-data.ts --confirmar');
  }
}

main()
  .catch((err) => {
    console.error('Erro durante a limpeza:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });