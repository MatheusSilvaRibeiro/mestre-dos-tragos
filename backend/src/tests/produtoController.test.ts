import { Request, Response } from 'express';
import {
  buscarPorId,
  listar,
  criar,
  editar,
  alternarDisponibilidade,
  desativar,
} from '../controllers/produtoController';
import prisma from '../config/prisma';

// Mocka o módulo inteiro do prisma singleton — nenhum teste aqui toca o banco de verdade
jest.mock('../config/prisma', () => ({
  __esModule: true,
  default: {
    produto: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    categoria: {
      findUnique: jest.fn(),
    },
  },
}));

// Helper pra criar um Response falso e conseguir inspecionar o que foi enviado
function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('produtoController.listar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna os produtos ativos ordenados por disponibilidade', async () => {
    const produtosFalsos = [
      { id: '1', nome: 'X-Burger', disponivel: true, ativo: true },
      { id: '2', nome: 'X-Salada', disponivel: false, ativo: true },
    ];

    (prisma.produto.findMany as jest.Mock).mockResolvedValue(produtosFalsos);

    const req = { query: {} } as Request;
    const res = mockResponse();

    await listar(req, res);

    expect(prisma.produto.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ativo: true },
      })
    );
    expect(res.json).toHaveBeenCalledWith(produtosFalsos);
  });

  it('filtra por categoriaId quando informado na query', async () => {
    (prisma.produto.findMany as jest.Mock).mockResolvedValue([]);

    const req = { query: { categoriaId: 'cat-123' } } as unknown as Request;
    const res = mockResponse();

    await listar(req, res);

    expect(prisma.produto.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ativo: true, categoriaId: 'cat-123' },
      })
    );
  });

  it('retorna 500 se o Prisma lançar um erro', async () => {
    (prisma.produto.findMany as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = { query: {} } as Request;
    const res = mockResponse();

    await listar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao listar produtos' });
  });
});

describe('produtoController.buscarPorId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna produto quando encontrado pelo id', async () => {
    const produtoFake = {
      id: 'prod-1',
      nome: 'X-Burger',
      ativo: true,
      disponivel: true,
    };

    (prisma.produto.findUnique as jest.Mock).mockResolvedValue(produtoFake);

    const req = {
      params: { id: 'prod-1' },
    } as unknown as Request;

    const res = mockResponse();

    await buscarPorId(req, res);

    expect(prisma.produto.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'prod-1' },
      })
    );

    expect(res.json).toHaveBeenCalledWith(produtoFake);
  });

  it('retorna 404 quando produto não é encontrado', async () => {
    (prisma.produto.findUnique as jest.Mock).mockResolvedValue(null);

    const req = {
      params: { id: 'prod-inexistente' },
    } as unknown as Request;

    const res = mockResponse();

    await buscarPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Produto não encontrado!',
    });
  });

  it('retorna 500 quando ocorre erro interno ao buscar produto', async () => {
    (prisma.produto.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {
      params: { id: 'prod-1' },
    } as unknown as Request;

    const res = mockResponse();

    await buscarPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Erro ao buscar produto',
    });
  });
});

describe('produtoController.criar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 quando faltam campos obrigatórios', async () => {
    const req = { body: { nome: 'X-Burger' } } as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Campos obrigatórios: nome, categoriaId, tipo',
    });
  });

  it('retorna 400 quando o tipo é inválido', async () => {
    const req = {
      body: { nome: 'X-Burger', categoriaId: 'cat-1', tipo: 'SOBREMESA' },
    } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Tipo inválido. Use um de: LANCHE, BATATA_FRITA, PORCAO_MISTA',
    });
  });

  it('retorna 400 quando LANCHE não tem preço válido', async () => {
    const req = {
      body: { nome: 'X-Burger', categoriaId: 'cat-1', tipo: 'LANCHE' },
    } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'LANCHE precisa de um preço válido (número >= 0)!',
    });
  });

  it('retorna 400 quando BATATA_FRITA não tem tamanhos', async () => {
    const req = {
      body: { nome: 'Batata', categoriaId: 'cat-1', tipo: 'BATATA_FRITA' },
    } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'BATATA_FRITA precisa de tamanhos (P, M, G) com preços!',
    });
  });

  it('retorna 400 quando um tamanho informado é inválido', async () => {
    const req = {
      body: {
        nome: 'Batata',
        categoriaId: 'cat-1',
        tipo: 'BATATA_FRITA',
        tamanhos: [{ tamanho: 'GG', preco: 10 }],
      },
    } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Tamanho inválido: GG. Use P, M ou G.',
    });
  });

  it('retorna 400 quando o preço de um tamanho é inválido', async () => {
    const req = {
      body: {
        nome: 'Batata',
        categoriaId: 'cat-1',
        tipo: 'BATATA_FRITA',
        tamanhos: [{ tamanho: 'P', preco: 'abc' }],
      },
    } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Preço inválido para o tamanho P',
    });
  });

  it('retorna 400 quando a categoria não existe', async () => {
    (prisma.categoria.findUnique as jest.Mock).mockResolvedValue(null);

    const req = {
      body: { nome: 'X-Burger', categoriaId: 'cat-inexistente', tipo: 'LANCHE', preco: 10 },
    } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(prisma.categoria.findUnique).toHaveBeenCalledWith({
      where: { id: 'cat-inexistente' },
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Categoria não encontrada!' });
  });

  it('cria um LANCHE com sucesso', async () => {
    (prisma.categoria.findUnique as jest.Mock).mockResolvedValue({ id: 'cat-1', nome: 'Lanches' });

    const produtoCriado = { id: 'prod-1', nome: 'X-Burger', tipo: 'LANCHE', preco: 10 };
    (prisma.produto.create as jest.Mock).mockResolvedValue(produtoCriado);

    const req = {
      body: {
        nome: 'X-Burger',
        categoriaId: 'cat-1',
        tipo: 'LANCHE',
        preco: 10,
        adicionaisIds: ['ad-1'],
      },
    } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(prisma.produto.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nome: 'X-Burger',
          preco: 10,
          disponivel: true,
          tipo: 'LANCHE',
          categoria: { connect: { id: 'cat-1' } },
          adicionaisProduto: {
            create: [{ adicional: { connect: { id: 'ad-1' } } }],
          },
        }),
      })
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      mensagem: 'Produto criado com sucesso!',
      produto: produtoCriado,
    });
  });

  it('cria uma BATATA_FRITA com tamanhos com sucesso', async () => {
    (prisma.categoria.findUnique as jest.Mock).mockResolvedValue({ id: 'cat-2', nome: 'Porções' });

    const produtoCriado = { id: 'prod-2', nome: 'Batata', tipo: 'BATATA_FRITA' };
    (prisma.produto.create as jest.Mock).mockResolvedValue(produtoCriado);

    const req = {
      body: {
        nome: 'Batata',
        categoriaId: 'cat-2',
        tipo: 'BATATA_FRITA',
        tamanhos: [
          { tamanho: 'P', preco: 10 },
          { tamanho: 'G', preco: 18 },
        ],
      },
    } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(prisma.produto.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tamanhos: {
            create: [
              { tamanho: 'P', preco: 10 },
              { tamanho: 'G', preco: 18 },
            ],
          },
        }),
      })
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('retorna 500 quando ocorre erro interno ao criar', async () => {
    (prisma.categoria.findUnique as jest.Mock).mockResolvedValue({ id: 'cat-1' });
    (prisma.produto.create as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {
      body: { nome: 'X-Burger', categoriaId: 'cat-1', tipo: 'LANCHE', preco: 10 },
    } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao criar produto' });
  });
});

describe('produtoController.editar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 404 quando o produto não existe', async () => {
    (prisma.produto.findUnique as jest.Mock).mockResolvedValue(null);

    const req = {
      params: { id: 'prod-inexistente' },
      body: { nome: 'Novo nome' },
    } as unknown as Request;
    const res = mockResponse();

    await editar(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Produto não encontrado!' });
  });

  it('retorna 400 quando a nova categoria não existe', async () => {
    (prisma.produto.findUnique as jest.Mock).mockResolvedValue({ id: 'prod-1' });
    (prisma.categoria.findUnique as jest.Mock).mockResolvedValue(null);

    const req = {
      params: { id: 'prod-1' },
      body: { categoriaId: 'cat-inexistente' },
    } as unknown as Request;
    const res = mockResponse();

    await editar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Categoria não encontrada!' });
  });

  it('retorna 400 quando o preço informado é inválido', async () => {
    (prisma.produto.findUnique as jest.Mock).mockResolvedValue({ id: 'prod-1' });

    const req = {
      params: { id: 'prod-1' },
      body: { preco: 'abc' },
    } as unknown as Request;
    const res = mockResponse();

    await editar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Preço inválido!' });
  });

  it('retorna 400 quando um tamanho informado é inválido', async () => {
    (prisma.produto.findUnique as jest.Mock).mockResolvedValue({ id: 'prod-1' });

    const req = {
      params: { id: 'prod-1' },
      body: { tamanhos: [{ tamanho: 'GG', preco: 10 }] },
    } as unknown as Request;
    const res = mockResponse();

    await editar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Tamanho inválido: GG. Use P, M ou G.',
    });
  });

  it('edita produto com sucesso', async () => {
    (prisma.produto.findUnique as jest.Mock).mockResolvedValue({ id: 'prod-1' });
    (prisma.categoria.findUnique as jest.Mock).mockResolvedValue({ id: 'cat-2' });

    const produtoAtualizado = { id: 'prod-1', nome: 'X-Bacon', disponivel: false };
    (prisma.produto.update as jest.Mock).mockResolvedValue(produtoAtualizado);

    const req = {
      params: { id: 'prod-1' },
      body: { nome: 'X-Bacon', categoriaId: 'cat-2', disponivel: false },
    } as unknown as Request;
    const res = mockResponse();

    await editar(req, res);

    expect(prisma.produto.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'prod-1' },
        data: expect.objectContaining({
          nome: 'X-Bacon',
          disponivel: false,
          categoria: { connect: { id: 'cat-2' } },
        }),
      })
    );

    expect(res.json).toHaveBeenCalledWith({
      mensagem: 'Produto atualizado com sucesso!',
      produto: produtoAtualizado,
    });
  });

  it('retorna 500 quando ocorre erro interno ao editar', async () => {
    (prisma.produto.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {
      params: { id: 'prod-1' },
      body: { nome: 'X-Bacon' },
    } as unknown as Request;
    const res = mockResponse();

    await editar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao editar produto' });
  });
});

describe('produtoController.alternarDisponibilidade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 404 quando o produto não existe', async () => {
    (prisma.produto.findUnique as jest.Mock).mockResolvedValue(null);

    const req = { params: { id: 'prod-inexistente' } } as unknown as Request;
    const res = mockResponse();

    await alternarDisponibilidade(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Produto não encontrado!' });
  });

  it('retorna 400 quando o produto está inativo', async () => {
    (prisma.produto.findUnique as jest.Mock).mockResolvedValue({ id: 'prod-1', ativo: false });

    const req = { params: { id: 'prod-1' } } as unknown as Request;
    const res = mockResponse();

    await alternarDisponibilidade(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Produto inativo não pode ter disponibilidade alterada!',
    });
  });

  it('marca produto disponível como DISPONÍVEL após alternar', async () => {
    (prisma.produto.findUnique as jest.Mock).mockResolvedValue({
      id: 'prod-1',
      ativo: true,
      disponivel: false,
    });

    (prisma.produto.update as jest.Mock).mockResolvedValue({
      id: 'prod-1',
      nome: 'X-Burger',
      disponivel: true,
    });

    const req = { params: { id: 'prod-1' } } as unknown as Request;
    const res = mockResponse();

    await alternarDisponibilidade(req, res);

    expect(prisma.produto.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { disponivel: true },
      select: { id: true, nome: true, disponivel: true },
    });

    expect(res.json).toHaveBeenCalledWith({
      mensagem: 'X-Burger está DISPONÍVEL!',
      produto: { id: 'prod-1', nome: 'X-Burger', disponivel: true },
    });
  });

  it('marca produto disponível como INDISPONÍVEL após alternar', async () => {
    (prisma.produto.findUnique as jest.Mock).mockResolvedValue({
      id: 'prod-1',
      ativo: true,
      disponivel: true,
    });

    (prisma.produto.update as jest.Mock).mockResolvedValue({
      id: 'prod-1',
      nome: 'X-Burger',
      disponivel: false,
    });

    const req = { params: { id: 'prod-1' } } as unknown as Request;
    const res = mockResponse();

    await alternarDisponibilidade(req, res);

    expect(res.json).toHaveBeenCalledWith({
      mensagem: 'X-Burger está INDISPONÍVEL!',
      produto: { id: 'prod-1', nome: 'X-Burger', disponivel: false },
    });
  });

  it('retorna 500 quando ocorre erro interno ao alternar disponibilidade', async () => {
    (prisma.produto.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = { params: { id: 'prod-1' } } as unknown as Request;
    const res = mockResponse();

    await alternarDisponibilidade(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao alterar disponibilidade' });
  });
});

describe('produtoController.desativar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 404 quando o produto não existe', async () => {
    (prisma.produto.findUnique as jest.Mock).mockResolvedValue(null);

    const req = { params: { id: 'prod-inexistente' } } as unknown as Request;
    const res = mockResponse();

    await desativar(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Produto não encontrado!' });
  });

  it('desativa produto com sucesso', async () => {
    (prisma.produto.findUnique as jest.Mock).mockResolvedValue({ id: 'prod-1' });
    (prisma.produto.update as jest.Mock).mockResolvedValue({ id: 'prod-1', ativo: false });

    const req = { params: { id: 'prod-1' } } as unknown as Request;
    const res = mockResponse();

    await desativar(req, res);

    expect(prisma.produto.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { ativo: false },
    });

    expect(res.json).toHaveBeenCalledWith({ mensagem: 'Produto desativado com sucesso!' });
  });

  it('retorna 500 quando ocorre erro interno ao desativar', async () => {
    (prisma.produto.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = { params: { id: 'prod-1' } } as unknown as Request;
    const res = mockResponse();

    await desativar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao desativar produto' });
  });
});