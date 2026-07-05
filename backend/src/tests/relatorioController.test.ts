import { Request, Response } from 'express';
import {
  resumoDia,
  faturamentoPeriodo,
  rankingProdutos,
  pedidosPorAtendente,
  pedidosPorStatus,
  taxaCancelamento,
  comparativoSemanal,
} from '../controllers/relatorioController';
import prisma from '../config/prisma';

// Mocka o módulo inteiro do prisma singleton — nenhum teste aqui toca o banco de verdade
jest.mock('../config/prisma', () => ({
  __esModule: true,
  default: {
    pedido: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    itemPedido: {
      findMany: jest.fn(),
    },
    usuario: {
      findMany: jest.fn(),
    },
  },
}));

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('relatorioController.resumoDia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Fixa o "hoje" numa quarta-feira para os cálculos de data ficarem previsíveis
    jest.useFakeTimers().setSystemTime(new Date('2026-07-01T15:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calcula faturamento, ticket médio e tempo de preparo considerando só pedidos entregues', async () => {
    const pedidosDia = [
      {
        status: 'ENTREGUE',
        valorTotal: 100,
        criadoEm: new Date('2026-07-01T12:00:00'),
        finalizadoEm: new Date('2026-07-01T12:20:00'), // 20 minutos de preparo
      },
      {
        status: 'ENTREGUE',
        valorTotal: 50,
        criadoEm: new Date('2026-07-01T13:00:00'),
        finalizadoEm: new Date('2026-07-01T13:10:00'), // 10 minutos de preparo
      },
      {
        status: 'CANCELADO',
        valorTotal: 30,
        criadoEm: new Date('2026-07-01T14:00:00'),
        finalizadoEm: null,
      },
    ];

    (prisma.pedido.findMany as jest.Mock).mockResolvedValue(pedidosDia);

    const req = {} as Request;
    const res = mockResponse();

    await resumoDia(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        totalPedidos: 3,
        pedidosEntregues: 2,
        pedidosCancelados: 1,
        faturamento: 150,
        ticketMedio: 75,
        tempoMedioPreparoMinutos: 15,
      })
    );
  });

  it('retorna zeros quando não há pedidos entregues no dia', async () => {
    (prisma.pedido.findMany as jest.Mock).mockResolvedValue([]);

    const req = {} as Request;
    const res = mockResponse();

    await resumoDia(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        totalPedidos: 0,
        pedidosEntregues: 0,
        pedidosCancelados: 0,
        faturamento: 0,
        ticketMedio: 0,
        tempoMedioPreparoMinutos: 0,
      })
    );
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.pedido.findMany as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {} as Request;
    const res = mockResponse();

    await resumoDia(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao gerar resumo do dia' });
  });
});

describe('relatorioController.faturamentoPeriodo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 quando falta informar as datas', async () => {
    const req = { query: {} } as unknown as Request;
    const res = mockResponse();

    await faturamentoPeriodo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ erro: expect.stringContaining('Informe as datas') })
    );
  });

  it('retorna 400 quando as datas informadas são inválidas', async () => {
    const req = {
      query: { inicio: 'data-invalida', fim: '2026-01-31' },
    } as unknown as Request;
    const res = mockResponse();

    await faturamentoPeriodo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Datas inválidas!' });
  });

  it('calcula faturamento, ticket médio e lista de cancelamentos do período', async () => {
    const pedidos = [
      {
        id: 'pedido-1',
        status: 'ENTREGUE',
        valorTotal: 100,
        criadoEm: new Date('2026-01-05T10:00:00'),
        nomeCliente: 'João',
        usuario: { nome: 'Atendente A' },
      },
      {
        id: 'pedido-2',
        status: 'CANCELADO',
        valorTotal: 40,
        criadoEm: new Date('2026-01-06T10:00:00'),
        nomeCliente: 'Maria',
        usuario: { nome: 'Atendente B' },
      },
    ];

    (prisma.pedido.findMany as jest.Mock).mockResolvedValue(pedidos);

    const req = {
      query: { inicio: '2026-01-01', fim: '2026-01-31' },
    } as unknown as Request;
    const res = mockResponse();

    await faturamentoPeriodo(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        resumo: expect.objectContaining({
          totalPedidos: 2,
          pedidosEntregues: 1,
          pedidosCancelados: 1,
          faturamentoTotal: 100,
          ticketMedio: 100,
        }),
        pedidosCancelados: [
          expect.objectContaining({ id: 'pedido-2', nomeCliente: 'Maria', atendente: 'Atendente B' }),
        ],
      })
    );
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.pedido.findMany as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {
      query: { inicio: '2026-01-01', fim: '2026-01-31' },
    } as unknown as Request;
    const res = mockResponse();

    await faturamentoPeriodo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao gerar relatório por período' });
  });
});

describe('relatorioController.rankingProdutos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('agrupa e ordena os produtos do mais para o menos vendido', async () => {
    const itens = [
      { produtoId: 'p1', quantidade: 5, subtotal: 50, produto: { id: 'p1', nome: 'X-Burger' } },
      { produtoId: 'p2', quantidade: 10, subtotal: 100, produto: { id: 'p2', nome: 'X-Salada' } },
      { produtoId: 'p1', quantidade: 3, subtotal: 30, produto: { id: 'p1', nome: 'X-Burger' } },
    ];

    (prisma.itemPedido.findMany as jest.Mock).mockResolvedValue(itens);

    const req = { query: {} } as unknown as Request;
    const res = mockResponse();

    await rankingProdutos(req, res);

    expect(prisma.itemPedido.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { pedido: { status: 'ENTREGUE' } } })
    );

    expect(res.json).toHaveBeenCalledWith({
      maisPedidos: [
        { id: 'p2', nome: 'X-Salada', quantidade: 10, totalArrecadado: 100 },
        { id: 'p1', nome: 'X-Burger', quantidade: 8, totalArrecadado: 80 },
      ],
      menosPedidos: [
        { id: 'p1', nome: 'X-Burger', quantidade: 8, totalArrecadado: 80 },
        { id: 'p2', nome: 'X-Salada', quantidade: 10, totalArrecadado: 100 },
      ],
    });
  });

  it('inclui filtro de data quando inicio e fim são informados', async () => {
    (prisma.itemPedido.findMany as jest.Mock).mockResolvedValue([]);

    const req = {
      query: { inicio: '2026-01-01', fim: '2026-01-31' },
    } as unknown as Request;
    const res = mockResponse();

    await rankingProdutos(req, res);

    expect(prisma.itemPedido.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          pedido: expect.objectContaining({
            status: 'ENTREGUE',
            criadoEm: expect.objectContaining({ gte: expect.any(Date), lte: expect.any(Date) }),
          }),
        }),
      })
    );
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.itemPedido.findMany as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = { query: {} } as unknown as Request;
    const res = mockResponse();

    await rankingProdutos(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao gerar ranking de produtos' });
  });
});

describe('relatorioController.pedidosPorAtendente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calcula métricas por atendente e ordena por total de pedidos', async () => {
    const atendentes = [
      {
        id: 'u1',
        nome: 'Ana',
        usuario: 'ana',
        role: 'ATENDENTE',
        pedidos: [
          { id: 'pd1', status: 'ENTREGUE', valorTotal: 50 },
          { id: 'pd2', status: 'CANCELADO', valorTotal: 20 },
        ],
      },
      {
        id: 'u2',
        nome: 'Bruno',
        usuario: 'bruno',
        role: 'ADMIN',
        pedidos: [
          { id: 'pd3', status: 'ENTREGUE', valorTotal: 30 },
          { id: 'pd4', status: 'ENTREGUE', valorTotal: 30 },
          { id: 'pd5', status: 'ENTREGUE', valorTotal: 30 },
        ],
      },
    ];

    (prisma.usuario.findMany as jest.Mock).mockResolvedValue(atendentes);

    const req = { query: {} } as unknown as Request;
    const res = mockResponse();

    await pedidosPorAtendente(req, res);

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'u2', nome: 'Bruno', totalPedidos: 3, faturamentoGerado: 90 }),
      expect.objectContaining({ id: 'u1', nome: 'Ana', totalPedidos: 2, faturamentoGerado: 50 }),
    ]);
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.usuario.findMany as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = { query: {} } as unknown as Request;
    const res = mockResponse();

    await pedidosPorAtendente(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao gerar relatório por atendente' });
  });
});

describe('relatorioController.pedidosPorStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-07-01T15:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('conta pedidos de cada status no dia informado', async () => {
    (prisma.pedido.count as jest.Mock)
      .mockResolvedValueOnce(5)  // PENDENTE
      .mockResolvedValueOnce(3)  // EM_PREPARO
      .mockResolvedValueOnce(2)  // PRONTO
      .mockResolvedValueOnce(10) // ENTREGUE
      .mockResolvedValueOnce(1); // CANCELADO

    const req = { query: { data: '2026-02-26' } } as unknown as Request;
    const res = mockResponse();

    await pedidosPorStatus(req, res);

    expect(prisma.pedido.count).toHaveBeenCalledTimes(5);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 21,
        porStatus: {
          PENDENTE: 5,
          EM_PREPARO: 3,
          PRONTO: 2,
          ENTREGUE: 10,
          CANCELADO: 1,
        },
      })
    );
  });

  it('usa a data de hoje quando nenhuma data é informada', async () => {
    (prisma.pedido.count as jest.Mock).mockResolvedValue(0);

    const req = { query: {} } as unknown as Request;
    const res = mockResponse();

    await pedidosPorStatus(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: '01/07/2026', total: 0 })
    );
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.pedido.count as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = { query: {} } as unknown as Request;
    const res = mockResponse();

    await pedidosPorStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao gerar relatório por status' });
  });
});

describe('relatorioController.taxaCancelamento', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calcula a taxa de cancelamento do período informado', async () => {
    (prisma.pedido.count as jest.Mock)
      .mockResolvedValueOnce(50) // total
      .mockResolvedValueOnce(5); // cancelados

    const req = {
      query: { inicio: '2026-02-01', fim: '2026-02-26' },
    } as unknown as Request;
    const res = mockResponse();

    await taxaCancelamento(req, res);

    expect(res.json).toHaveBeenCalledWith({
      periodo: { inicio: '2026-02-01', fim: '2026-02-26' },
      totalPedidos: 50,
      cancelados: 5,
      taxaCancelamento: '10.00%',
    });
  });

  it('retorna geral quando não há período informado', async () => {
    (prisma.pedido.count as jest.Mock).mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const req = { query: {} } as unknown as Request;
    const res = mockResponse();

    await taxaCancelamento(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ periodo: 'geral', taxaCancelamento: '0.00%' })
    );
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.pedido.count as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = { query: {} } as unknown as Request;
    const res = mockResponse();

    await taxaCancelamento(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao gerar taxa de cancelamento' });
  });
});

describe('relatorioController.comparativoSemanal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Quarta-feira, 01/07/2026 — semana atual começa segunda 29/06/2026
    jest.useFakeTimers().setSystemTime(new Date('2026-07-01T15:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('compara o faturamento da semana atual com o da semana passada', async () => {
    (prisma.pedido.findMany as jest.Mock)
      .mockResolvedValueOnce([{ valorTotal: 100 }, { valorTotal: 100 }]) // semana atual: 200
      .mockResolvedValueOnce([{ valorTotal: 50 }]); // semana passada: 50

    const req = {} as Request;
    const res = mockResponse();

    await comparativoSemanal(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        semanaAtual: expect.objectContaining({ totalPedidos: 2, faturamento: 200, ticketMedio: 100 }),
        semanaPassada: expect.objectContaining({ totalPedidos: 1, faturamento: 50, ticketMedio: 50 }),
        variacao: '300.00%',
      })
    );
  });

  it('indica que não há dados anteriores quando a semana passada não teve faturamento', async () => {
    (prisma.pedido.findMany as jest.Mock)
      .mockResolvedValueOnce([{ valorTotal: 100 }])
      .mockResolvedValueOnce([]);

    const req = {} as Request;
    const res = mockResponse();

    await comparativoSemanal(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ variacao: 'sem dados anteriores' })
    );
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.pedido.findMany as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {} as Request;
    const res = mockResponse();

    await comparativoSemanal(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao gerar comparativo semanal' });
  });
});