import prisma from '../../config/prisma';

// 
// MÉTRICAS DO DIA
// Calcula os números do dia atual — do primeiro ao último segundo de hoje.
// Cancelados não entram no faturamento, mas pendentes e em preparo contam nos alertas.
// 
export async function getMetricasHoje() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  // Busca todos os pedidos de hoje, exceto cancelados
  const pedidosHoje = await prisma.pedido.findMany({
    where: {
      criadoEm: { gte: hoje, lt: amanha },
      status:   { not: 'CANCELADO' },
    },
    include: { itens: true },
  });

  const faturamentoHoje = pedidosHoje.reduce(
    (acc, p) => acc + Number(p.valorTotal), 0
  );

  // Pedidos pendentes = o que ainda está na fila da cozinha agora
  const pedidosPendentes = await prisma.pedido.count({
    where: {
      status: { in: ['PENDENTE', 'EM_PREPARO'] },
    },
  });

  // Ticket médio = quanto cada pedido rendeu em média hoje
  const ticketMedio = pedidosHoje.length > 0
    ? faturamentoHoje / pedidosHoje.length
    : 0;

  return {
    pedidosHoje:      pedidosHoje.length,
    faturamentoHoje,
    ticketMedio,
    pedidosPendentes,
  };
}

// 
// RESUMO GERAL
// Totalizadores de todo o histórico do sistema.
// Usa Promise.all para rodar as 4 consultas em paralelo — muito mais rápido.
// 
export async function getResumoGeral() {
  const [totalPedidos, totalFaturamento, totalProdutos, totalFuncionarios] =
    await Promise.all([

      // Conta todos os pedidos que não foram cancelados
      prisma.pedido.count({
        where: { status: { not: 'CANCELADO' } },
      }),

      // Soma o valor total de todos os pedidos não cancelados
      prisma.pedido.aggregate({
        _sum:  { valorTotal: true },
        where: { status: { not: 'CANCELADO' } },
      }),

      // Conta produtos ativos — disponíveis ou não, mas que existem no cardápio
      prisma.produto.count({
        where: { ativo: true },
      }),

      // Conta funcionários ativos no sistema
      prisma.usuario.count({
        where: { ativo: true },
      }),
    ]);

  return {
    totalPedidos,
    totalFaturamento: Number(totalFaturamento._sum.valorTotal ?? 0),
    totalProdutos,
    totalFuncionarios,
  };
}

// 
// TOP PRODUTOS
// Agrupa os itens de pedidos por produto e ranqueia os 10 mais vendidos.
// Busca os nomes separadamente para não depender de join — mais flexível.
// 
export async function getTopProdutos() {
  // groupBy conta quantas vezes cada produto foi pedido (somando quantidade)
  const itens = await prisma.itemPedido.groupBy({
    by:      ['produtoId'],
    _sum:    { quantidade: true },
    orderBy: { _sum: { quantidade: 'desc' } },
    take:    10,
    where: {
      pedido: { status: { not: 'CANCELADO' } },
    },
  });

  const produtosIds = itens.map(i => i.produtoId);

  // Busca os nomes dos produtos do ranking em uma única query
  const produtos = await prisma.produto.findMany({
    where:  { id: { in: produtosIds } },
    select: { id: true, nome: true },
  });

  // Junta o ranking com os nomes — se o produto foi deletado, exibe fallback
  return itens.map(item => {
    const produto = produtos.find(p => p.id === item.produtoId);
    return {
      nome:       produto?.nome ?? 'Produto removido',
      quantidade: item._sum.quantidade ?? 0,
    };
  });
}

// 
// FATURAMENTO POR PERÍODO
// Retorna o faturamento dia a dia para montar o gráfico no dashboard.
// Usa um Map para agrupar os pedidos por data sem precisar de query extra.
// 
export async function getFaturamentoPeriodo(periodo: '7d' | '30d' | '90d') {
  const dias = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90;

  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() - dias);
  dataInicio.setHours(0, 0, 0, 0);

  const pedidos = await prisma.pedido.findMany({
    where: {
      criadoEm: { gte: dataInicio },
      status:   { not: 'CANCELADO' },
    },
    select: {
      criadoEm:   true,
      valorTotal: true,
    },
    orderBy: { criadoEm: 'asc' },
  });

  // Agrupa faturamento e contagem de pedidos por dia (formato YYYY-MM-DD)
  const porDia = new Map<string, { faturamento: number; pedidos: number }>();

  pedidos.forEach(p => {
    const dia   = p.criadoEm.toISOString().split('T')[0];
    const atual = porDia.get(dia) ?? { faturamento: 0, pedidos: 0 };
    porDia.set(dia, {
      faturamento: atual.faturamento + Number(p.valorTotal),
      pedidos:     atual.pedidos + 1,
    });
  });

  return Array.from(porDia.entries()).map(([data, valores]) => ({
    data,
    faturamento: valores.faturamento,
    pedidos:     valores.pedidos,
  }));
}