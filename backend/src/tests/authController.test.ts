import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  cadastrar,
  deletarFuncionario,
  editarFuncionario,
  listarFuncionarios,
  login,
} from '../controllers/authController';
import prisma from '../config/prisma';

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
jest.mock('jsonwebtoken');

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authController.login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 quando usuario ou senha não são informados', async () => {
    const req = { body: {} } as Request;
    const res = mockResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Informe usuário e senha' });
  });

  it('retorna 401 quando usuário não existe', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null);

    const req = {
      body: { usuario: 'admin', senha: '123' },
    } as Request;

    const res = mockResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Usuário ou senha incorretos' });
  });

  it('retorna 401 quando usuário está desativado', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      usuario: 'admin',
      nome: 'Admin',
      senha: 'hash',
      role: 'ADMIN',
      ativo: false,
    });

    const req = {
      body: { usuario: 'admin', senha: '123' },
    } as Request;

    const res = mockResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Usuário desativado.' });
  });

  it('retorna 401 quando senha está incorreta', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      usuario: 'admin',
      nome: 'Admin',
      senha: 'hash',
      role: 'ADMIN',
      ativo: true,
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const req = {
      body: { usuario: 'admin', senha: 'errada' },
    } as Request;

    const res = mockResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Usuário ou senha incorretos' });
  });

  it('retorna token e funcionário quando login é válido', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      usuario: 'admin',
      nome: 'Administrador',
      senha: 'hash',
      role: 'ADMIN',
      ativo: true,
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('token-fake');

    const req = {
      body: { usuario: 'admin', senha: 'admin123' },
    } as Request;

    const res = mockResponse();

    await login(req, res);

    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 'user-1', role: 'ADMIN' },
      process.env.JWT_SECRET || 'secret_padrao',
      { expiresIn: '8h' }
    );

    expect(res.json).toHaveBeenCalledWith({
      mensagem: 'Bem vindo, Administrador!',
      token: 'token-fake',
      funcionario: {
        id: 'user-1',
        usuario: 'admin',
        nome: 'Administrador',
        role: 'ADMIN',
      },
    });
  });

  it('retorna 500 quando ocorre erro interno no login', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {
      body: { usuario: 'admin', senha: '123' },
    } as Request;

    const res = mockResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: 'Erro interno do servidor' });
  });
});

describe('authController.cadastrar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 quando faltam campos obrigatórios', async () => {
    const req = { body: { usuario: 'joao' } } as Request;
    const res = mockResponse();

    await cadastrar(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Campos obrigatórios: usuario, nome, senha',
    });
  });

  it('retorna 400 quando usuário já existe', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      usuario: 'joao',
    });

    const req = {
      body: {
        usuario: 'joao',
        nome: 'João',
        senha: '123456',
      },
    } as Request;

    const res = mockResponse();

    await cadastrar(req, res);

    expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
      where: { usuario: 'joao' },
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Usuário já existe!',
    });
  });

  it('cadastra funcionário com sucesso usando role padrão ATENDENTE', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('senha-hash');

    const usuarioCriado = {
      id: 'user-1',
      usuario: 'joao',
      nome: 'João',
      role: 'ATENDENTE',
      ativo: true,
      criadoEm: new Date('2026-01-01'),
    };

    (prisma.usuario.create as jest.Mock).mockResolvedValue(usuarioCriado);

    const req = {
      body: {
        usuario: 'joao',
        nome: 'João',
        senha: '123456',
      },
    } as Request;

    const res = mockResponse();

    await cadastrar(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);

    expect(prisma.usuario.create).toHaveBeenCalledWith({
      data: {
        usuario: 'joao',
        nome: 'João',
        senha: 'senha-hash',
        role: 'ATENDENTE',
      },
      select: {
        id: true,
        usuario: true,
        nome: true,
        role: true,
        ativo: true,
        criadoEm: true,
      },
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      mensagem: 'Funcionário cadastrado!',
      usuario: usuarioCriado,
    });
  });

  it('cadastra funcionário com role informado', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('senha-hash');

    const usuarioCriado = {
      id: 'user-2',
      usuario: 'maria',
      nome: 'Maria',
      role: 'COZINHA',
      ativo: true,
      criadoEm: new Date('2026-01-01'),
    };

    (prisma.usuario.create as jest.Mock).mockResolvedValue(usuarioCriado);

    const req = {
      body: {
        usuario: 'maria',
        nome: 'Maria',
        senha: '123456',
        role: 'COZINHA',
      },
    } as Request;

    const res = mockResponse();

    await cadastrar(req, res);

    expect(prisma.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          usuario: 'maria',
          nome: 'Maria',
          senha: 'senha-hash',
          role: 'COZINHA',
        }),
      })
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      mensagem: 'Funcionário cadastrado!',
      usuario: usuarioCriado,
    });
  });

  it('retorna 500 quando ocorre erro interno no cadastro', async () => {
    (prisma.usuario.findUnique as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {
      body: {
        usuario: 'joao',
        nome: 'João',
        senha: '123456',
      },
    } as Request;

    const res = mockResponse();

    await cadastrar(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Erro interno do servidor',
    });
  });
});

describe('authController.listarFuncionarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista funcionários sem expor senha', async () => {
    const funcionarios = [
      {
        id: 'user-1',
        usuario: 'admin',
        nome: 'Administrador',
        role: 'ADMIN',
        ativo: true,
        criadoEm: new Date('2026-01-01'),
      },
    ];

    (prisma.usuario.findMany as jest.Mock).mockResolvedValue(funcionarios);

    const req = {} as Request;
    const res = mockResponse();

    await listarFuncionarios(req, res);

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

    expect(res.json).toHaveBeenCalledWith(funcionarios);
  });

  it('retorna 500 quando ocorre erro interno ao listar funcionários', async () => {
    (prisma.usuario.findMany as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {} as Request;
    const res = mockResponse();

    await listarFuncionarios(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Erro interno do servidor',
    });
  });
});

describe('authController.editarFuncionario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('atualiza funcionário sem alterar senha', async () => {
    const atualizado = {
      id: 'user-1',
      usuario: 'joao',
      nome: 'João Atualizado',
      role: 'ATENDENTE',
      ativo: true,
      criadoEm: new Date('2026-01-01'),
    };

    (prisma.usuario.update as jest.Mock).mockResolvedValue(atualizado);

    const req = {
      params: { id: 'user-1' },
      body: {
        nome: 'João Atualizado',
        usuario: 'joao',
        role: 'ATENDENTE',
        ativo: true,
      },
    } as unknown as Request;

    const res = mockResponse();

    await editarFuncionario(req, res);

    expect(bcrypt.hash).not.toHaveBeenCalled();

    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        nome: 'João Atualizado',
        usuario: 'joao',
        role: 'ATENDENTE',
        ativo: true,
      },
      select: {
        id: true,
        usuario: true,
        nome: true,
        role: true,
        ativo: true,
        criadoEm: true,
      },
    });

    expect(res.json).toHaveBeenCalledWith({
      mensagem: 'Funcionário atualizado!',
      usuario: atualizado,
    });
  });

  it('atualiza funcionário criptografando nova senha', async () => {
    const atualizado = {
      id: 'user-1',
      usuario: 'joao',
      nome: 'João Atualizado',
      role: 'ATENDENTE',
      ativo: true,
      criadoEm: new Date('2026-01-01'),
    };

    (bcrypt.hash as jest.Mock).mockResolvedValue('nova-senha-hash');
    (prisma.usuario.update as jest.Mock).mockResolvedValue(atualizado);

    const req = {
      params: { id: 'user-1' },
      body: {
        nome: 'João Atualizado',
        usuario: 'joao',
        role: 'ATENDENTE',
        ativo: true,
        senha: 'nova-senha',
      },
    } as unknown as Request;

    const res = mockResponse();

    await editarFuncionario(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith('nova-senha', 10);

    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        nome: 'João Atualizado',
        usuario: 'joao',
        role: 'ATENDENTE',
        ativo: true,
        senha: 'nova-senha-hash',
      },
      select: {
        id: true,
        usuario: true,
        nome: true,
        role: true,
        ativo: true,
        criadoEm: true,
      },
    });

    expect(res.json).toHaveBeenCalledWith({
      mensagem: 'Funcionário atualizado!',
      usuario: atualizado,
    });
  });

  it('retorna 500 quando ocorre erro interno ao editar funcionário', async () => {
    (prisma.usuario.update as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {
      params: { id: 'user-1' },
      body: {
        nome: 'João',
        usuario: 'joao',
        role: 'ATENDENTE',
        ativo: true,
      },
    } as unknown as Request;

    const res = mockResponse();

    await editarFuncionario(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Erro interno do servidor',
    });
  });
});

describe('authController.deletarFuncionario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deleta funcionário com sucesso', async () => {
    (prisma.usuario.delete as jest.Mock).mockResolvedValue({
      id: 'user-1',
    });

    const req = {
      params: { id: 'user-1' },
    } as unknown as Request;

    const res = mockResponse();

    await deletarFuncionario(req, res);

    expect(prisma.usuario.delete).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });

    expect(res.json).toHaveBeenCalledWith({
      mensagem: 'Funcionário deletado com sucesso!',
    });
  });

  it('retorna 500 quando ocorre erro interno ao deletar funcionário', async () => {
    (prisma.usuario.delete as jest.Mock).mockRejectedValue(new Error('DB caiu'));

    const req = {
      params: { id: 'user-1' },
    } as unknown as Request;

    const res = mockResponse();

    await deletarFuncionario(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      erro: 'Erro interno do servidor',
    });
  });
});