import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { ZodError } from 'zod';
import {
  cadastrarFuncionarioSchema,
  editarFuncionarioSchema,
  loginSchema,
} from '../validators/authSchemas';

// ─────────────────────────────────────────────────────────
// LISTAR FUNCIONÁRIOS — GET /api/auth/funcionarios
// Retorna todos os funcionários cadastrados, sem expor a senha
// ─────────────────────────────────────────────────────────
export async function listarFuncionarios(req: Request, res: Response) {
  try {
    const funcionarios = await prisma.usuario.findMany({
      // Nunca retornamos a senha — mesmo criptografada não precisa sair daqui
      select: { id: true, usuario: true, nome: true, role: true, ativo: true, criadoEm: true },
      orderBy: { criadoEm: 'asc' },
    });

    return res.json(funcionarios);
  } catch {
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
}

// ─────────────────────────────────────────────────────────
// CADASTRAR FUNCIONÁRIO — POST /api/auth/cadastrar
// Só ADMIN pode cadastrar. A senha já sai criptografada do banco.
// ─────────────────────────────────────────────────────────
export async function cadastrar(req: Request, res: Response) {
  try {
    const { usuario, nome, senha, role } = cadastrarFuncionarioSchema.parse(req.body);

    const existe = await prisma.usuario.findUnique({ where: { usuario } });
    if (existe) {
      return res.status(400).json({ erro: 'Usuário já existe!' });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const novo = await prisma.usuario.create({
      data: {
        usuario,
        nome,
        senha: senhaCriptografada,
        role: role || 'ATENDENTE',
      },
      select: { id: true, usuario: true, nome: true, role: true, ativo: true, criadoEm: true },
    });

    return res.status(201).json({ mensagem: 'Funcionário cadastrado!', usuario: novo });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ erro: 'Campos obrigatórios: usuario, nome, senha' });
    }

    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
}

// ─────────────────────────────────────────────────────────
// LOGIN — POST /api/auth/login
// Rota pública. Valida usuário e senha, retorna o token JWT.
// O token carrega o id e o role — isso é o que o sistema usa pra controlar acesso.
// ─────────────────────────────────────────────────────────
export async function login(req: Request, res: Response) {
  try {
    const { usuario, senha } = loginSchema.parse(req.body);

    const funcionario = await prisma.usuario.findUnique({ where: { usuario } });

    if (!funcionario) {
      return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
    }

    if (!funcionario.ativo) {
      return res.status(401).json({ erro: 'Usuário desativado.' });
    }

    const senhaCorreta = await bcrypt.compare(senha, funcionario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
    }

    const token = jwt.sign(
      { id: funcionario.id, role: funcionario.role },
      process.env.JWT_SECRET || 'secret_padrao',
      { expiresIn: '8h' },
    );

    return res.json({
      mensagem: `Bem vindo, ${funcionario.nome}!`,
      token,
      funcionario: {
        id: funcionario.id,
        usuario: funcionario.usuario,
        nome: funcionario.nome,
        role: funcionario.role,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ erro: 'Informe usuário e senha' });
    }

    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
}

// ─────────────────────────────────────────────────────────
// EDITAR FUNCIONÁRIO — PUT /api/auth/funcionarios/:id
// Atualiza os dados do funcionário. Se enviar senha, já recriptografa.
// ─────────────────────────────────────────────────────────
export async function editarFuncionario(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { nome, usuario, role, ativo, senha } = editarFuncionarioSchema.parse(req.body);

    const dados: {
      nome?: string;
      usuario?: string;
      role?: 'ADMIN' | 'ATENDENTE' | 'COZINHA';
      ativo?: boolean;
      senha?: string;
    } = { nome, usuario, role, ativo };

    if (senha) {
      dados.senha = await bcrypt.hash(senha, 10);
    }

    const atualizado = await prisma.usuario.update({
      where: { id },
      data: dados,
      select: { id: true, usuario: true, nome: true, role: true, ativo: true, criadoEm: true },
    });

    return res.json({ mensagem: 'Funcionário atualizado!', usuario: atualizado });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ erro: 'Dados inválidos para atualizar funcionário' });
    }

    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
}

// ─────────────────────────────────────────────────────────
// DELETAR FUNCIONÁRIO — DELETE /api/auth/funcionarios/:id
// Remove o funcionário permanentemente do banco.
// Considere usar desativação (ativo: false) no lugar disso no futuro.
// ─────────────────────────────────────────────────────────
export async function deletarFuncionario(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    await prisma.usuario.delete({ where: { id } });

    return res.json({ mensagem: 'Funcionário deletado com sucesso!' });
  } catch {
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
}