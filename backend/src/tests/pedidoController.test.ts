import { Request, Response } from 'express';
import {
  criar,
  listar,
  buscarPorId,
  atualizarStatus,
  cancelar,
} from '../controllers/pedidoController';
import prisma from '../config/prisma';
import { getIO } from '../config/socket';

// Mocka o módulo inteiro do prisma singleton — nenhum teste aqui toca o banco de verdade
jest.mock('../config/prisma', () => ({
  __esModule: true,
  default: {
    produto: {
      findUnique: jest.fn(),
    },
    adicional: {
      findUnique: jest.fn(),
    },
    adicionalTamanho: {
      findFirst: jest.fn(),
    },
    pedido: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// A criação e atualização de pedido emitem eventos via Socket.IO — mocka pra não
// precisar de um servidor real rodando durante os testes.
jest.mock('../config/socket', () => ({
  getIO: jest.fn(),
}));

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockEmit() {
  const emit = jest.fn();
  (getIO as jest.Mock).mockReturnValue({ emit });
  return emit;
}

describe('pedidoController.criar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 quando o pedido não tem itens', async () => {
    const req = {
      usuario: { id: 'user-1', role: 'ATENDENTE' },
      body: { itens: [] },
    } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Pedido precisa ter pelo menos 1 item!' });
  });

  it('retorna 400 quando um produto do pedido não existe', async () => {
    (prisma.produto.findUnique as jest.Mock).mockResolvedValue(null);

    const req = {
      usuario: { id: 'user-1', role: 'ATENDENTE' },
      body: { itens: [{ produtoId: 'prod-inexistente', quantidade: 1 }] },
    } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Produto não encontrado: prod-inexistente' });
  });

  it('retorna 400 quando o produto está indisponível ou inativo', async () => {
    (prisma.produto.findUnique as jest.Mock).mockResolvedValue({
      id: 'prod-1',
      nome: 'X-Burger',
      tipo: 'LANCHE',
      disponivel: false,
      ativo: true,
      preco: 10,
      tamanhos: [],
    });

    const req = {
      usuario: { id: 'user-1', role: 'ATENDENTE' },
      body: { itens: [{ produtoId: 'prod-1', quantidade: 1 }] },
    } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Produto indisponível ou inativo: X-Burger' });
  });

  it('retorna 400 quando falta tamanho para BATATA_FRITA', async () => {
    (prisma.produto.findUnique as jest.Mock).mockResolvedValue({
      id: 'prod-2',
      nome: 'Batata',
      tipo: 'BATATA_FRITA',
      disponivel: true,
      ativo: true,
      tamanhos: [{ tamanho: 'P', preco: 10 }],
    });

    const req = {
      usuario: { id: 'user-1', role: 'ATENDENTE' },
      body: { itens: [{ produtoId: 'prod-2', quantidade: 1 }] },
    } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Tamanho obrigatório para Batata! Use: P, M ou G',
    });
  });

  it('retorna 400 quando a quantidade é inválida', async () => {
    (prisma.produto.findUnique as jest.Mock).mockResolvedValue({
      id: 'prod-1',
      nome: 'X-Burger',
      tipo: 'LANCHE',
      disponivel: true,
      ativo: true,
      preco: 10,
      tamanhos: [],
    });

    const req = {
      usuario: { id: 'user-1', role: 'ATENDENTE' },
      body: { itens: [{ produtoId: 'prod-1', quantidade: 0 }] },
    } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Quantidade inválida!' });
  });

  it('cria pedido com um LANCHE e adicional, calculando o subtotal corretamente', async () => {
    (prisma.produto.findUnique as jest.Mock).mockResolvedValue({
      id: 'prod-1',
      nome: 'X-Burger',
      tipo: 'LANCHE',
      disponivel: true,
      ativo: true,
      preco: 10,
      tamanhos: [],
    });

    (prisma.adicional.findUnique as jest.Mock).mockResolvedValue({
      id: 'ad-1',
      preco: 2,
    });

    const pedidoCriado = { id: 'pedido-1', valorTotal: 24 };
    (prisma.pedido.create as jest.Mock).mockResolvedValue(pedidoCriado);

    const emit = mockEmit();

    const req = {
      usuario: { id: 'user-1', role: 'ATENDENTE' },
      body: {
        nomeCliente: 'João',
        itens: [
          { produtoId: 'prod-1', quantidade: 2, adicionais: ['ad-1'] },
        ],
      },
    } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    // preço unitário = 10 (lanche) + 2 (adicional) = 12; subtotal = 12 * 2 = 24
    expect(prisma.pedido.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          usuario: { connect: { id: 'user-1' } },
          nomeCliente: 'João',
          valorTotal: 24,
          status: 'PENDENTE',
          itens: {
            create: [
              expect.objectContaining({
                produto: { connect: { id: 'prod-1' } },
                quantidade: 2,
                precoUnit: 12,
                subtotal: 24,
                adicionais: { create: [{ adicionalId: 'ad-1', preco: 2 }] },
              }),
            ],
          },
        }),
      })
    );

    expect(emit).toHaveBeenCalledWith('pedido:novo', pedidoCriado);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      mensagem: 'Pedido criado com sucesso!',
      pedido: pedidoCriado,
    });
  });

  it('cria pedido com PORCAO_MISTA multiplicando o preço pela quantidade de sabores', async () => {
    (prisma.produto.findUnique as jest.Mock).mockResolvedValue({
      id: 'prod-3',
      nome: 'Porção Mista',
      tipo: 'PORCAO_MISTA',
      disponivel: true,
      ativo: true,
      tamanhos: [{ tamanho: 'M', preco: 15 }],
    });

    const pedidoCriado = { id: 'pedido-2', valorTotal: 30 };
    (prisma.pedido.create as jest.Mock).mockResolvedValue(pedidoCriado);
    mockEmit();

    const req = {
      usuario: { id: 'user-1', role: 'ATENDENTE' },
      body: {
        itens: [
          {
            produtoId: 'prod-3',
            quantidade: 1,
            tamanho: 'M',
            sabores: ['Calabresa', 'Queijo'],
          },
        ],
      },
    } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    // preço unitário = 15 (tamanho M) * 2 sabores = 30
    expect(prisma.pedido.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          valorTotal: 30,
          itens: {
            create: [
              expect.objectContaining({
                precoUnit: 30,
                subtotal: 30,
                sabores: { create: [{ nome: 'Calabresa' }, { nome: 'Queijo' }] },
              }),
            ],
          },
        }),
      })
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('retorna 500 quando ocorre erro interno ao criar pedido', async () => {
    (prisma.produto.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {
      usuario: { id: 'user-1', role: 'ATENDENTE' },
      body: { itens: [{ produtoId: 'prod-1', quantidade: 1 }] },
    } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao criar pedido' });
  });
});

describe('pedidoController.listar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista pedidos sem filtro de status usando o limite padrão de 50', async () => {
    const pedidos = [{ id: 'pedido-1' }];
    (prisma.pedido.findMany as jest.Mock).mockResolvedValue(pedidos);

    const req = { query: {} } as unknown as Request;
    const res = mockResponse();

    await listar(req, res);

    expect(prisma.pedido.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        take: 50,
        orderBy: { criadoEm: 'asc' },
      })
    );

    expect(res.json).toHaveBeenCalledWith({ pedidos });
  });

  it('filtra por status válidos informados na query, ignorando os inválidos', async () => {
    (prisma.pedido.findMany as jest.Mock).mockResolvedValue([]);

    const req = {
      query: { status: 'PENDENTE,EM_PREPARO,STATUS_INVALIDO', limit: '10' },
    } as unknown as Request;
    const res = mockResponse();

    await listar(req, res);

    expect(prisma.pedido.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { in: ['PENDENTE', 'EM_PREPARO'] } },
        take: 10,
      })
    );
  });

  it('retorna 500 quando ocorre erro interno ao listar pedidos', async () => {
    (prisma.pedido.findMany as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = { query: {} } as unknown as Request;
    const res = mockResponse();

    await listar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao listar pedidos' });
  });
});

describe('pedidoController.buscarPorId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna o pedido quando encontrado', async () => {
    const pedido = { id: 'pedido-1' };
    (prisma.pedido.findUnique as jest.Mock).mockResolvedValue(pedido);

    const req = { params: { id: 'pedido-1' } } as unknown as Request;
    const res = mockResponse();

    await buscarPorId(req, res);

    expect(prisma.pedido.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'pedido-1' } })
    );
    expect(res.json).toHaveBeenCalledWith(pedido);
  });

  it('retorna 404 quando o pedido não é encontrado', async () => {
    (prisma.pedido.findUnique as jest.Mock).mockResolvedValue(null);

    const req = { params: { id: 'pedido-inexistente' } } as unknown as Request;
    const res = mockResponse();

    await buscarPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Pedido não encontrado!' });
  });

  it('retorna 500 quando ocorre erro interno ao buscar pedido', async () => {
    (prisma.pedido.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = { params: { id: 'pedido-1' } } as unknown as Request;
    const res = mockResponse();

    await buscarPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao buscar pedido' });
  });
});

describe('pedidoController.atualizarStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 quando o status não é informado', async () => {
    const req = { params: { id: 'pedido-1' }, body: {} } as unknown as Request;
    const res = mockResponse();

    await atualizarStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Status é obrigatório!' });
  });

  it('retorna 400 quando o status informado é inválido', async () => {
    const req = {
      params: { id: 'pedido-1' },
      body: { status: 'STATUS_INVALIDO' },
    } as unknown as Request;
    const res = mockResponse();

    await atualizarStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ erro: expect.stringContaining('Status inválido') })
    );
  });

  it('retorna 404 quando o pedido não existe', async () => {
    (prisma.pedido.findUnique as jest.Mock).mockResolvedValue(null);

    const req = {
      params: { id: 'pedido-inexistente' },
      body: { status: 'EM_PREPARO' },
    } as unknown as Request;
    const res = mockResponse();

    await atualizarStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Pedido não encontrado!' });
  });

  it('retorna 400 quando a transição de status não é permitida', async () => {
    (prisma.pedido.findUnique as jest.Mock).mockResolvedValue({ id: 'pedido-1', status: 'PRONTO' });

    const req = {
      params: { id: 'pedido-1' },
      body: { status: 'PENDENTE' },
    } as unknown as Request;
    const res = mockResponse();

    await atualizarStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Não é possível mudar de PRONTO para PENDENTE!',
      transicoesPermitidas: ['ENTREGUE'],
    });
  });

  it('atualiza o status com sucesso e emite o evento pedido:atualizado', async () => {
    (prisma.pedido.findUnique as jest.Mock).mockResolvedValue({ id: 'pedido-1', status: 'PENDENTE' });

    const pedidoAtualizado = { id: 'pedido-1', status: 'EM_PREPARO' };
    (prisma.pedido.update as jest.Mock).mockResolvedValue(pedidoAtualizado);

    const emit = mockEmit();

    const req = {
      params: { id: 'pedido-1' },
      body: { status: 'EM_PREPARO' },
    } as unknown as Request;
    const res = mockResponse();

    await atualizarStatus(req, res);

    expect(prisma.pedido.update).toHaveBeenCalledWith({
      where: { id: 'pedido-1' },
      data: { status: 'EM_PREPARO', finalizadoEm: undefined },
    });

    expect(emit).toHaveBeenCalledWith('pedido:atualizado', pedidoAtualizado);
    expect(res.json).toHaveBeenCalledWith({ mensagem: 'Status atualizado!', pedido: pedidoAtualizado });
  });

  it('registra finalizadoEm quando o status muda para ENTREGUE', async () => {
    (prisma.pedido.findUnique as jest.Mock).mockResolvedValue({ id: 'pedido-1', status: 'PRONTO' });
    (prisma.pedido.update as jest.Mock).mockResolvedValue({ id: 'pedido-1', status: 'ENTREGUE' });
    mockEmit();

    const req = {
      params: { id: 'pedido-1' },
      body: { status: 'ENTREGUE' },
    } as unknown as Request;
    const res = mockResponse();

    await atualizarStatus(req, res);

    expect(prisma.pedido.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'ENTREGUE', finalizadoEm: expect.any(Date) }),
      })
    );
  });

  it('retorna 500 quando ocorre erro interno ao atualizar status', async () => {
    (prisma.pedido.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {
      params: { id: 'pedido-1' },
      body: { status: 'EM_PREPARO' },
    } as unknown as Request;
    const res = mockResponse();

    await atualizarStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao atualizar status' });
  });
});

describe('pedidoController.cancelar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 404 quando o pedido não existe', async () => {
    (prisma.pedido.findUnique as jest.Mock).mockResolvedValue(null);

    const req = { params: { id: 'pedido-inexistente' } } as unknown as Request;
    const res = mockResponse();

    await cancelar(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Pedido não encontrado!' });
  });

  it('retorna 400 quando o pedido não pode mais ser cancelado', async () => {
    (prisma.pedido.findUnique as jest.Mock).mockResolvedValue({ id: 'pedido-1', status: 'ENTREGUE' });

    const req = { params: { id: 'pedido-1' } } as unknown as Request;
    const res = mockResponse();

    await cancelar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Não é possível cancelar um pedido com status ENTREGUE!',
    });
  });

  it('cancela um pedido PENDENTE com sucesso', async () => {
    (prisma.pedido.findUnique as jest.Mock).mockResolvedValue({ id: 'pedido-1', status: 'PENDENTE' });

    const pedidoCancelado = { id: 'pedido-1', status: 'CANCELADO' };
    (prisma.pedido.update as jest.Mock).mockResolvedValue(pedidoCancelado);

    const req = { params: { id: 'pedido-1' } } as unknown as Request;
    const res = mockResponse();

    await cancelar(req, res);

    expect(prisma.pedido.update).toHaveBeenCalledWith({
      where: { id: 'pedido-1' },
      data: { status: 'CANCELADO' },
    });

    expect(res.json).toHaveBeenCalledWith({ mensagem: 'Pedido cancelado!', pedido: pedidoCancelado });
  });

  it('retorna 500 quando ocorre erro interno ao cancelar', async () => {
    (prisma.pedido.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = { params: { id: 'pedido-1' } } as unknown as Request;
    const res = mockResponse();

    await cancelar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao cancelar pedido' });
  });
});