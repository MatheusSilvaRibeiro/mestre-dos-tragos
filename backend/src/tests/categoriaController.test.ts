import { Request, Response } from 'express';
import { listar, criar, editar, desativar } from '../controllers/categoriaController';
import prisma from '../config/prisma';

// Mocka o módulo inteiro do prisma singleton — nenhum teste aqui toca o banco de verdade
jest.mock('../config/prisma', () => ({
  __esModule: true,
  default: {
    categoria: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    produto: {
      findFirst: jest.fn(),
    },
  },
}));

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('categoriaController.listar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista as categorias ativas ordenadas por nome', async () => {
    const categorias = [{ id: 'cat-1', nome: 'Lanches' }];
    (prisma.categoria.findMany as jest.Mock).mockResolvedValue(categorias);

    const req = { query: {} } as unknown as Request;
    const res = mockResponse();

    await listar(req, res);

    expect(prisma.categoria.findMany).toHaveBeenCalledWith({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });
    expect(res.json).toHaveBeenCalledWith(categorias);
  });

  it('lista TODAS as categorias (inclusive inativas) quando ?todos=true', async () => {
    const categorias = [
      { id: 'cat-1', nome: 'Lanches', ativo: true },
      { id: 'cat-2', nome: 'Bebidas', ativo: false },
    ];
    (prisma.categoria.findMany as jest.Mock).mockResolvedValue(categorias);

    const req = { query: { todos: 'true' } } as unknown as Request;
    const res = mockResponse();

    await listar(req, res);

    expect(prisma.categoria.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { nome: 'asc' },
    });
    expect(res.json).toHaveBeenCalledWith(categorias);
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.categoria.findMany as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = { query: {} } as unknown as Request;
    const res = mockResponse();

    await listar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao listar categorias' });
  });
});

describe('categoriaController.criar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 quando o nome não é informado', async () => {
    const req = { body: {} } as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Nome é obrigatório!' });
  });

  it('retorna 400 quando já existe categoria com esse nome', async () => {
    (prisma.categoria.findUnique as jest.Mock).mockResolvedValue({ id: 'cat-1', nome: 'Lanches' });

    const req = { body: { nome: 'Lanches' } } as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(prisma.categoria.findUnique).toHaveBeenCalledWith({ where: { nome: 'Lanches' } });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Já existe uma categoria com esse nome!' });
  });

  it('cria a categoria com sucesso', async () => {
    (prisma.categoria.findUnique as jest.Mock).mockResolvedValue(null);

    const categoriaCriada = { id: 'cat-2', nome: 'Bebidas' };
    (prisma.categoria.create as jest.Mock).mockResolvedValue(categoriaCriada);

    const req = { body: { nome: 'Bebidas' } } as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(prisma.categoria.create).toHaveBeenCalledWith({ data: { nome: 'Bebidas' } });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      mensagem: 'Categoria criada com sucesso!',
      categoria: categoriaCriada,
    });
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.categoria.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = { body: { nome: 'Bebidas' } } as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao criar categoria' });
  });
});

describe('categoriaController.editar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 quando o nome não é informado', async () => {
    const req = { params: { id: 'cat-1' }, body: {} } as unknown as Request;
    const res = mockResponse();

    await editar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Nome é obrigatório!' });
  });

  it('retorna 404 quando a categoria não existe', async () => {
    (prisma.categoria.findUnique as jest.Mock).mockResolvedValue(null);

    const req = {
      params: { id: 'cat-inexistente' },
      body: { nome: 'Bebidas' },
    } as unknown as Request;
    const res = mockResponse();

    await editar(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Categoria não encontrada!' });
  });

  it('edita a categoria com sucesso', async () => {
    (prisma.categoria.findUnique as jest.Mock).mockResolvedValue({ id: 'cat-1', nome: 'Lanches' });

    const categoriaAtualizada = { id: 'cat-1', nome: 'Lanches Especiais' };
    (prisma.categoria.update as jest.Mock).mockResolvedValue(categoriaAtualizada);

    const req = {
      params: { id: 'cat-1' },
      body: { nome: 'Lanches Especiais' },
    } as unknown as Request;
    const res = mockResponse();

    await editar(req, res);

    expect(prisma.categoria.update).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
      data: { nome: 'Lanches Especiais' },
    });
    expect(res.json).toHaveBeenCalledWith({
      mensagem: 'Categoria atualizada com sucesso!',
      categoria: categoriaAtualizada,
    });
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.categoria.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {
      params: { id: 'cat-1' },
      body: { nome: 'Lanches Especiais' },
    } as unknown as Request;
    const res = mockResponse();

    await editar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao editar categoria' });
  });
});

describe('categoriaController.desativar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 404 quando a categoria não existe', async () => {
    (prisma.categoria.findUnique as jest.Mock).mockResolvedValue(null);

    const req = { params: { id: 'cat-inexistente' } } as unknown as Request;
    const res = mockResponse();

    await desativar(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Categoria não encontrada!' });
  });

  it('retorna 400 quando a categoria ainda tem produtos ativos', async () => {
    (prisma.categoria.findUnique as jest.Mock).mockResolvedValue({ id: 'cat-1' });
    (prisma.produto.findFirst as jest.Mock).mockResolvedValue({ id: 'prod-1' });

    const req = { params: { id: 'cat-1' } } as unknown as Request;
    const res = mockResponse();

    await desativar(req, res);

    expect(prisma.produto.findFirst).toHaveBeenCalledWith({
      where: { categoriaId: 'cat-1', ativo: true },
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Não é possível desativar! Existem produtos nessa categoria.',
    });
  });

  it('desativa a categoria com sucesso quando não há produtos ativos', async () => {
    (prisma.categoria.findUnique as jest.Mock).mockResolvedValue({ id: 'cat-1' });
    (prisma.produto.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.categoria.update as jest.Mock).mockResolvedValue({ id: 'cat-1', ativo: false });

    const req = { params: { id: 'cat-1' } } as unknown as Request;
    const res = mockResponse();

    await desativar(req, res);

    expect(prisma.categoria.update).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
      data: { ativo: false },
    });
    expect(res.json).toHaveBeenCalledWith({ mensagem: 'Categoria desativada com sucesso!' });
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.categoria.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = { params: { id: 'cat-1' } } as unknown as Request;
    const res = mockResponse();

    await desativar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao desativar categoria' });
  });
});