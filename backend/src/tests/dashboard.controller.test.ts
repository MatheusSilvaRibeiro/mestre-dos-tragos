import { Request, Response } from 'express';
import {
  metricasHoje,
  resumoGeral,
  topProdutos,
  faturamentoPeriodo,
} from '../modules/dashboard/dashboard.controller';
import {
  getMetricasHoje,
  getResumoGeral,
  getTopProdutos,
  getFaturamentoPeriodo,
} from '../modules/dashboard/dashboard.service';

// O controller só delega pro service — mocka o service inteiro
jest.mock('../modules/dashboard/dashboard.service', () => ({
  getMetricasHoje: jest.fn(),
  getResumoGeral: jest.fn(),
  getTopProdutos: jest.fn(),
  getFaturamentoPeriodo: jest.fn(),
}));

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('dashboard.controller.metricasHoje', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna os dados do service', async () => {
    const dados = { pedidosHoje: 5, faturamentoHoje: 100, ticketMedio: 20, pedidosPendentes: 2 };
    (getMetricasHoje as jest.Mock).mockResolvedValue(dados);

    const req = {} as Request;
    const res = mockResponse();

    await metricasHoje(req, res);

    expect(res.json).toHaveBeenCalledWith(dados);
  });

  it('retorna 500 quando o service falha', async () => {
    (getMetricasHoje as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {} as Request;
    const res = mockResponse();

    await metricasHoje(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao buscar métricas do dia.' });
  });
});

describe('dashboard.controller.resumoGeral', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna os dados do service', async () => {
    const dados = { totalPedidos: 10, totalFaturamento: 1000, totalProdutos: 5, totalFuncionarios: 3 };
    (getResumoGeral as jest.Mock).mockResolvedValue(dados);

    const req = {} as Request;
    const res = mockResponse();

    await resumoGeral(req, res);

    expect(res.json).toHaveBeenCalledWith(dados);
  });

  it('retorna 500 quando o service falha', async () => {
    (getResumoGeral as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {} as Request;
    const res = mockResponse();

    await resumoGeral(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao buscar resumo geral.' });
  });
});

describe('dashboard.controller.topProdutos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna os dados do service', async () => {
    const dados = [{ nome: 'X-Burger', quantidade: 20 }];
    (getTopProdutos as jest.Mock).mockResolvedValue(dados);

    const req = {} as Request;
    const res = mockResponse();

    await topProdutos(req, res);

    expect(res.json).toHaveBeenCalledWith(dados);
  });

  it('retorna 500 quando o service falha', async () => {
    (getTopProdutos as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {} as Request;
    const res = mockResponse();

    await topProdutos(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao buscar top produtos.' });
  });
});

describe('dashboard.controller.faturamentoPeriodo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('usa 7d como período padrão quando nenhum é informado', async () => {
    const dados = [{ data: '2026-01-01', faturamento: 100, pedidos: 2 }];
    (getFaturamentoPeriodo as jest.Mock).mockResolvedValue(dados);

    const req = { query: {} } as unknown as Request;
    const res = mockResponse();

    await faturamentoPeriodo(req, res);

    expect(getFaturamentoPeriodo).toHaveBeenCalledWith('7d');
    expect(res.json).toHaveBeenCalledWith(dados);
  });

  it('aceita 30d e 90d como períodos válidos', async () => {
    (getFaturamentoPeriodo as jest.Mock).mockResolvedValue([]);

    const req = { query: { periodo: '30d' } } as unknown as Request;
    const res = mockResponse();

    await faturamentoPeriodo(req, res);

    expect(getFaturamentoPeriodo).toHaveBeenCalledWith('30d');
  });

  it('retorna 400 quando o período é inválido', async () => {
    const req = { query: { periodo: '1d' } } as unknown as Request;
    const res = mockResponse();

    await faturamentoPeriodo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Período inválido. Use 7d, 30d ou 90d.' });
    expect(getFaturamentoPeriodo).not.toHaveBeenCalled();
  });

  it('retorna 500 quando o service falha', async () => {
    (getFaturamentoPeriodo as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = { query: { periodo: '7d' } } as unknown as Request;
    const res = mockResponse();

    await faturamentoPeriodo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao buscar faturamento por período.' });
  });
});