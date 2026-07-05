import { Request, Response } from 'express';
import { listar, buscarPorId, criar, editar, desativar } from '../controllers/adicionalController';
import prisma from '../config/prisma';

// Mocka o módulo inteiro do prisma singleton — nenhum teste aqui toca o banco de verdade
jest.mock('../config/prisma', () => ({
  __esModule: true,
  default: {
    adicional: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('adicionalController.listar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista os adicionais ativos ordenados por nome', async () => {
    const adicionais = [{ id: 'ad-1', nome: 'Bacon', ativo: true }];
    (prisma.adicional.findMany as jest.Mock).mockResolvedValue(adicionais);

    const req = {} as Request;
    const res = mockResponse();

    await listar(req, res);

    expect(prisma.adicional.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ativo: true },
        orderBy: { nome: 'asc' },
      })
    );
    expect(res.json).toHaveBeenCalledWith(adicionais);
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.adicional.findMany as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {} as Request;
    const res = mockResponse();

    await listar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao listar adicionais' });
  });
});

describe('adicionalController.buscarPorId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna o adicional quando encontrado', async () => {
    const adicional = { id: 'ad-1', nome: 'Bacon' };
    (prisma.adicional.findUnique as jest.Mock).mockResolvedValue(adicional);

    const req = { params: { id: 'ad-1' } } as unknown as Request;
    const res = mockResponse();

    await buscarPorId(req, res);

    expect(prisma.adicional.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'ad-1' } })
    );
    expect(res.json).toHaveBeenCalledWith(adicional);
  });

  it('retorna 404 quando o adicional não é encontrado', async () => {
    (prisma.adicional.findUnique as jest.Mock).mockResolvedValue(null);

    const req = { params: { id: 'ad-inexistente' } } as unknown as Request;
    const res = mockResponse();

    await buscarPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Adicional não encontrado!' });
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.adicional.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = { params: { id: 'ad-1' } } as unknown as Request;
    const res = mockResponse();

    await buscarPorId(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao buscar adicional' });
  });
});

describe('adicionalController.criar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 quando faltam campos obrigatórios', async () => {
    const req = { body: { nome: 'Bacon' } } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Campos obrigatórios: nome, preco' });
  });

  it('cria um adicional simples, sem preço por tamanho', async () => {
    const adicionalCriado = { id: 'ad-1', nome: 'Bacon', preco: 3 };
    (prisma.adicional.create as jest.Mock).mockResolvedValue(adicionalCriado);

    const req = { body: { nome: 'Bacon', preco: 3 } } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(prisma.adicional.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { nome: 'Bacon', preco: 3 },
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      mensagem: 'Adicional criado com sucesso!',
      adicional: adicionalCriado,
    });
  });

  it('cria um adicional com preço por tamanho', async () => {
    const adicionalCriado = { id: 'ad-2', nome: 'Queijo Extra' };
    (prisma.adicional.create as jest.Mock).mockResolvedValue(adicionalCriado);

    const req = {
      body: {
        nome: 'Queijo Extra',
        preco: 0,
        precoPorTamanho: [
          { tamanho: 'P', preco: 2 },
          { tamanho: 'G', preco: 4 },
        ],
      },
    } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(prisma.adicional.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nome: 'Queijo Extra',
          precoPorTamanho: {
            create: [
              { tamanho: 'P', preco: 2 },
              { tamanho: 'G', preco: 4 },
            ],
          },
        }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.adicional.create as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = { body: { nome: 'Bacon', preco: 3 } } as unknown as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao criar adicional' });
  });
});

describe('adicionalController.editar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 404 quando o adicional não existe', async () => {
    (prisma.adicional.findUnique as jest.Mock).mockResolvedValue(null);

    const req = {
      params: { id: 'ad-inexistente' },
      body: { nome: 'Bacon' },
    } as unknown as Request;
    const res = mockResponse();

    await editar(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Adicional não encontrado!' });
  });

  it('edita o adicional substituindo o preço por tamanho', async () => {
    (prisma.adicional.findUnique as jest.Mock).mockResolvedValue({ id: 'ad-1' });

    const adicionalAtualizado = { id: 'ad-1', nome: 'Bacon Extra' };
    (prisma.adicional.update as jest.Mock).mockResolvedValue(adicionalAtualizado);

    const req = {
      params: { id: 'ad-1' },
      body: {
        nome: 'Bacon Extra',
        precoPorTamanho: [{ tamanho: 'M', preco: 3 }],
      },
    } as unknown as Request;
    const res = mockResponse();

    await editar(req, res);

    expect(prisma.adicional.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ad-1' },
        data: expect.objectContaining({
          nome: 'Bacon Extra',
          precoPorTamanho: {
            deleteMany: {},
            create: [{ tamanho: 'M', preco: 3 }],
          },
        }),
      })
    );
    expect(res.json).toHaveBeenCalledWith({
      mensagem: 'Adicional atualizado com sucesso!',
      adicional: adicionalAtualizado,
    });
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.adicional.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {
      params: { id: 'ad-1' },
      body: { nome: 'Bacon' },
    } as unknown as Request;
    const res = mockResponse();

    await editar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao editar adicional' });
  });
});

describe('adicionalController.desativar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 404 quando o adicional não existe', async () => {
    (prisma.adicional.findUnique as jest.Mock).mockResolvedValue(null);

    const req = { params: { id: 'ad-inexistente' } } as unknown as Request;
    const res = mockResponse();

    await desativar(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Adicional não encontrado!' });
  });

  it('desativa o adicional com sucesso', async () => {
    (prisma.adicional.findUnique as jest.Mock).mockResolvedValue({ id: 'ad-1' });
    (prisma.adicional.update as jest.Mock).mockResolvedValue({ id: 'ad-1', ativo: false });

    const req = { params: { id: 'ad-1' } } as unknown as Request;
    const res = mockResponse();

    await desativar(req, res);

    expect(prisma.adicional.update).toHaveBeenCalledWith({
      where: { id: 'ad-1' },
      data: { ativo: false },
    });
    expect(res.json).toHaveBeenCalledWith({ mensagem: 'Adicional desativado com sucesso!' });
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.adicional.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = { params: { id: 'ad-1' } } as unknown as Request;
    const res = mockResponse();

    await desativar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao desativar adicional' });
  });
});