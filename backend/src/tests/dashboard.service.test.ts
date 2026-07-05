import {
  getMetricasHoje,
  getResumoGeral,
  getTopProdutos,
  getFaturamentoPeriodo,
} from '../modules/dashboard/dashboard.service';
import prisma from '../config/prisma';

// Mocka o módulo inteiro do prisma singleton — nenhum teste aqui toca o banco de verdade
jest.mock('../config/prisma', () => ({
  __esModule: true,
  default: {
    pedido: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    produto: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    usuario: {
      count: jest.fn(),
    },
    itemPedido: {
      groupBy: jest.fn(),
    },
  },
}));

describe('dashboard.service.getMetricasHoje', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calcula faturamento, ticket médio e pedidos pendentes do dia', async () => {
    (prisma.pedido.findMany as jest.Mock).mockResolvedValue([
      { valorTotal: 100 },
      { valorTotal: 50 },
    ]);
    (prisma.pedido.count as jest.Mock).mockResolvedValue(4);

    const resultado = await getMetricasHoje();

    expect(prisma.pedido.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { not: 'CANCELADO' } }),
      })
    );
    expect(prisma.pedido.count).toHaveBeenCalledWith({
      where: { status: { in: ['PENDENTE', 'EM_PREPARO'] } },
    });

    expect(resultado).toEqual({
      pedidosHoje: 2,
      faturamentoHoje: 150,
      ticketMedio: 75,
      pedidosPendentes: 4,
    });
  });

  it('retorna ticket médio zero quando não há pedidos hoje', async () => {
    (prisma.pedido.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.pedido.count as jest.Mock).mockResolvedValue(0);

    const resultado = await getMetricasHoje();

    expect(resultado).toEqual({
      pedidosHoje: 0,
      faturamentoHoje: 0,
      ticketMedio: 0,
      pedidosPendentes: 0,
    });
  });
});

describe('dashboard.service.getResumoGeral', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('totaliza pedidos, faturamento, produtos e funcionários', async () => {
    (prisma.pedido.count as jest.Mock).mockResolvedValue(120);
    (prisma.pedido.aggregate as jest.Mock).mockResolvedValue({ _sum: { valorTotal: 4567.8 } });
    (prisma.produto.count as jest.Mock).mockResolvedValue(30);
    (prisma.usuario.count as jest.Mock).mockResolvedValue(5);

    const resultado = await getResumoGeral();

    expect(resultado).toEqual({
      totalPedidos: 120,
      totalFaturamento: 4567.8,
      totalProdutos: 30,
      totalFuncionarios: 5,
    });
  });

  it('usa zero quando a soma do faturamento vem nula', async () => {
    (prisma.pedido.count as jest.Mock).mockResolvedValue(0);
    (prisma.pedido.aggregate as jest.Mock).mockResolvedValue({ _sum: { valorTotal: null } });
    (prisma.produto.count as jest.Mock).mockResolvedValue(0);
    (prisma.usuario.count as jest.Mock).mockResolvedValue(0);

    const resultado = await getResumoGeral();

    expect(resultado.totalFaturamento).toBe(0);
  });
});

describe('dashboard.service.getTopProdutos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('junta o ranking do groupBy com os nomes dos produtos', async () => {
    (prisma.itemPedido.groupBy as jest.Mock).mockResolvedValue([
      { produtoId: 'p1', _sum: { quantidade: 20 } },
      { produtoId: 'p2', _sum: { quantidade: 15 } },
    ]);

    (prisma.produto.findMany as jest.Mock).mockResolvedValue([
      { id: 'p1', nome: 'X-Burger' },
      { id: 'p2', nome: 'X-Salada' },
    ]);

    const resultado = await getTopProdutos();

    expect(prisma.itemPedido.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['produtoId'],
        take: 10,
        where: { pedido: { status: { not: 'CANCELADO' } } },
      })
    );

    expect(resultado).toEqual([
      { nome: 'X-Burger', quantidade: 20 },
      { nome: 'X-Salada', quantidade: 15 },
    ]);
  });

  it('usa fallback quando o produto foi removido ou a quantidade é nula', async () => {
    (prisma.itemPedido.groupBy as jest.Mock).mockResolvedValue([
      { produtoId: 'p-deletado', _sum: { quantidade: null } },
    ]);
    (prisma.produto.findMany as jest.Mock).mockResolvedValue([]);

    const resultado = await getTopProdutos();

    expect(resultado).toEqual([{ nome: 'Produto removido', quantidade: 0 }]);
  });
});

describe('dashboard.service.getFaturamentoPeriodo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('agrupa faturamento e contagem de pedidos por dia', async () => {
    (prisma.pedido.findMany as jest.Mock).mockResolvedValue([
      { criadoEm: new Date('2026-01-05T15:00:00Z'), valorTotal: 100 },
      { criadoEm: new Date('2026-01-05T18:00:00Z'), valorTotal: 50 },
      { criadoEm: new Date('2026-01-06T15:00:00Z'), valorTotal: 200 },
    ]);

    const resultado = await getFaturamentoPeriodo('7d');

    expect(resultado).toEqual([
      { data: '2026-01-05', faturamento: 150, pedidos: 2 },
      { data: '2026-01-06', faturamento: 200, pedidos: 1 },
    ]);
  });

  it('retorna array vazio quando não há pedidos no período', async () => {
    (prisma.pedido.findMany as jest.Mock).mockResolvedValue([]);

    const resultado = await getFaturamentoPeriodo('30d');

    expect(resultado).toEqual([]);
  });
});