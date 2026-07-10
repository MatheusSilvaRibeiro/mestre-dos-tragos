import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { ZodError } from 'zod';
import prisma from '../config/prisma';
import { criarUsuarioSchema, atualizarUsuarioSchema } from '../validators/usuarioSchemas';

// 
// LISTAR USUÁRIOS — GET /api/usuarios
// Retorna todos os funcionários cadastrados, sem expor a senha.
// Ordenados por data de criação — os mais antigos aparecem primeiro.
// 
export async function listar(req: Request, res: Response) {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id:       true,
        usuario:  true,
        nome:     true,
        role:     true,
        ativo:    true,
        criadoEm: true,
      },
      orderBy: { criadoEm: 'asc' },
    });

    return res.json(usuarios);
  } catch {
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
}

// 
// CRIAR USUÁRIO — POST /api/usuarios
// 
export async function criar(req: Request, res: Response) {
  try {
    const { usuario, nome, senha, role } = criarUsuarioSchema.parse(req.body);

    const existe = await prisma.usuario.findUnique({ where: { usuario } });
    if (existe) {
      return res.status(400).json({ erro: 'Esse nome de usuário já está em uso!' });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const novo = await prisma.usuario.create({
      data: {
        usuario,
        nome,
        senha: senhaCriptografada,
        role: role || 'ATENDENTE',
      },
      select: {
        id:       true,
        usuario:  true,
        nome:     true,
        role:     true,
        ativo:    true,
        criadoEm: true,
      },
    });

    return res.status(201).json(novo);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ erro: error.issues[0].message });
    }

    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
}

// 
// ATUALIZAR USUÁRIO — PUT /api/usuarios/:id
// 
export async function atualizar(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { nome, usuario, role, ativo, senha } = atualizarUsuarioSchema.parse(req.body);

    const existe = await prisma.usuario.findUnique({ where: { id } });
    if (!existe) {
      return res.status(404).json({ erro: 'Funcionário não encontrado' });
    }

    const data: Record<string, unknown> = {};
    if (nome    !== undefined) data.nome    = nome;
    if (usuario !== undefined) data.usuario = usuario;
    if (role    !== undefined) data.role    = role;
    if (ativo   !== undefined) data.ativo   = ativo;

    if (senha) {
      data.senha = await bcrypt.hash(senha, 10);
    }

    const atualizado = await prisma.usuario.update({
      where: { id },
      data,
      select: {
        id:       true,
        usuario:  true,
        nome:     true,
        role:     true,
        ativo:    true,
        criadoEm: true,
      },
    });

    return res.json(atualizado);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ erro: error.issues[0].message });
    }

    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
}

// 
// DELETAR USUÁRIO — DELETE /api/usuarios/:id
// 
export async function deletar(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const existe = await prisma.usuario.findUnique({ where: { id } });
    if (!existe) {
      return res.status(404).json({ erro: 'Funcionário não encontrado' });
    }

    await prisma.usuario.delete({ where: { id } });

    return res.json({ mensagem: 'Funcionário deletado com sucesso!' });
  } catch (error) {
    console.error('ERRO AO DELETAR:', error);
    return res.status(500).json({ erro: 'Erro ao deletar funcionário' });
  }
}