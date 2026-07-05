import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { listar, criar, atualizar, deletar } from '../controllers/usuarioController';
import prisma from '../config/prisma';

// Mocka o módulo inteiro do prisma singleton — nenhum teste aqui toca o banco de verdade
jest.mock('../config/prisma', () => ({
  __esModule: true,
  default: {
    usuario: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('bcrypt');

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('usuarioController.listar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista os usuários sem expor a senha', async () => {
    const usuarios = [{ id: 'user-1', usuario: 'admin', nome: 'Admin', role: 'ADMIN' }];
    (prisma.usuario.findMany as jest.Mock).mockResolvedValue(usuarios);

    const req = {} as Request;
    const res = mockResponse();

    await listar(req, res);

    expect(prisma.usuario.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        usuario: true,
        nome: true,
        role: true,
        ativo: true,
        criadoEm: true,
      },
      orderBy: { criadoEm: 'asc' },
    });
    expect(res.json).toHaveBeenCalledWith(usuarios);
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.usuario.findMany as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {} as Request;
    const res = mockResponse();

    await listar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro interno do servidor' });
  });
});

describe('usuarioController.criar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 quando faltam campos obrigatórios', async () => {
    const req = { body: { usuario: 'joao' } } as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Campos obrigatórios: usuario, nome, senha',
    });
  });

  it('retorna 400 quando o nome de usuário já está em uso', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1', usuario: 'joao' });

    const req = {
      body: { usuario: 'joao', nome: 'João', senha: '123456' },
    } as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Esse nome de usuário já está em uso!' });
  });

  it('cria o usuário com role padrão ATENDENTE quando não informado', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('senha-hash');

    const usuarioCriado = { id: 'user-1', usuario: 'joao', nome: 'João', role: 'ATENDENTE' };
    (prisma.usuario.create as jest.Mock).mockResolvedValue(usuarioCriado);

    const req = {
      body: { usuario: 'joao', nome: 'João', senha: '123456' },
    } as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
    expect(prisma.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          usuario: 'joao',
          nome: 'João',
          senha: 'senha-hash',
          role: 'ATENDENTE',
        },
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(usuarioCriado);
  });

  it('cria o usuário com o role informado', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('senha-hash');
    (prisma.usuario.create as jest.Mock).mockResolvedValue({ id: 'user-2', role: 'COZINHA' });

    const req = {
      body: { usuario: 'maria', nome: 'Maria', senha: '123456', role: 'COZINHA' },
    } as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(prisma.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'COZINHA' }),
      })
    );
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {
      body: { usuario: 'joao', nome: 'João', senha: '123456' },
    } as Request;
    const res = mockResponse();

    await criar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro interno do servidor' });
  });
});

describe('usuarioController.atualizar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 404 quando o funcionário não existe', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null);

    const req = {
      params: { id: 'user-inexistente' },
      body: { nome: 'João' },
    } as unknown as Request;
    const res = mockResponse();

    await atualizar(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Funcionário não encontrado' });
  });

  it('atualiza apenas os campos informados, sem alterar a senha', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const atualizado = { id: 'user-1', nome: 'João Atualizado' };
    (prisma.usuario.update as jest.Mock).mockResolvedValue(atualizado);

    const req = {
      params: { id: 'user-1' },
      body: { nome: 'João Atualizado' },
    } as unknown as Request;
    const res = mockResponse();

    await atualizar(req, res);

    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: { nome: 'João Atualizado' },
      })
    );
    expect(res.json).toHaveBeenCalledWith(atualizado);
  });

  it('recriptografa a senha quando uma nova senha é informada', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (bcrypt.hash as jest.Mock).mockResolvedValue('nova-senha-hash');
    (prisma.usuario.update as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const req = {
      params: { id: 'user-1' },
      body: { senha: 'nova-senha' },
    } as unknown as Request;
    const res = mockResponse();

    await atualizar(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith('nova-senha', 10);
    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { senha: 'nova-senha-hash' },
      })
    );
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {
      params: { id: 'user-1' },
      body: { nome: 'João' },
    } as unknown as Request;
    const res = mockResponse();

    await atualizar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro interno do servidor' });
  });
});

describe('usuarioController.deletar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 404 quando o funcionário não existe', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null);

    const req = { params: { id: 'user-inexistente' } } as unknown as Request;
    const res = mockResponse();

    await deletar(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Funcionário não encontrado' });
  });

  it('deleta o funcionário com sucesso', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (prisma.usuario.delete as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const req = { params: { id: 'user-1' } } as unknown as Request;
    const res = mockResponse();

    await deletar(req, res);

    expect(prisma.usuario.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(res.json).toHaveBeenCalledWith({ mensagem: 'Funcionário deletado com sucesso!' });
  });

  it('retorna 500 quando ocorre erro interno', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = { params: { id: 'user-1' } } as unknown as Request;
    const res = mockResponse();

    await deletar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao deletar funcionário' });
  });
});