import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/prisma';

// 
// LISTAR USUÁRIOS — GET /api/usuarios
// Retorna todos os funcionários cadastrados, sem expor a senha.
// Ordenados por data de criação — os mais antigos aparecem primeiro.
// 
export async function listar(req: Request, res: Response) {
  try {
    const usuarios = await prisma.usuario.findMany({
      // Nunca devolvemos a senha — mesmo criptografada não precisa sair daqui
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
// Cadastra um novo funcionário no sistema.
// A senha já é criptografada antes de salvar — nunca armazenamos senha em texto puro.
// 
export async function criar(req: Request, res: Response) {
  try {
    const { usuario, nome, senha, role } = req.body;

    // Valida os campos mínimos antes de bater no banco
    if (!usuario || !nome || !senha) {
      return res.status(400).json({ erro: 'Campos obrigatórios: usuario, nome, senha' });
    }

    // Garante que o login escolhido ainda não está em uso
    const existe = await prisma.usuario.findUnique({ where: { usuario } });
    if (existe) {
      return res.status(400).json({ erro: 'Esse nome de usuário já está em uso!' });
    }

    // Criptografa a senha com bcrypt antes de salvar no banco
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const novo = await prisma.usuario.create({
      data: {
        usuario,
        nome,
        senha: senhaCriptografada,
        // Se não informar o cargo, assume ATENDENTE como padrão
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
  } catch {
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
}

// 
// ATUALIZAR USUÁRIO — PUT /api/usuarios/:id
// Atualiza os dados de um funcionário. Todos os campos são opcionais.
// Se enviar uma nova senha, ela já é recriptografada antes de salvar.
// 
export async function atualizar(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { nome, usuario, role, ativo, senha } = req.body;

    // Verifica se o funcionário existe antes de tentar atualizar
    const existe = await prisma.usuario.findUnique({ where: { id } });
    if (!existe) {
      return res.status(404).json({ erro: 'Funcionário não encontrado' });
    }

    // Monta o objeto de atualização só com os campos que foram enviados
    // Campos ausentes ficam intactos no banco — atualização parcial segura
    const data: Record<string, unknown> = {};
    if (nome    !== undefined) data.nome    = nome;
    if (usuario !== undefined) data.usuario = usuario;
    if (role    !== undefined) data.role    = role;
    if (ativo   !== undefined) data.ativo   = ativo;

    // Se veio uma nova senha, criptografa antes de incluir no update
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
  } catch {
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
}

// 
// DELETAR USUÁRIO — DELETE /api/usuarios/:id
// Remove o funcionário permanentemente do banco de dados.
// Considere usar { ativo: false } no futuro para preservar o histórico de pedidos.
// 
export async function deletar(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    // Verifica se o funcionário existe antes de tentar deletar
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