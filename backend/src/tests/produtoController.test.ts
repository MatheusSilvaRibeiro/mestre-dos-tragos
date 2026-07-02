import { Request, Response } from 'express';
import { listar } from '../controllers/produtoController';
import prisma from '../config/prisma';

// Mocka o módulo inteiro do prisma singleton — nenhum teste aqui toca o banco de verdade
jest.mock('../config/prisma', () => ({
  __esModule: true,
  default: {
    produto: {
      findMany: jest.fn(),
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
