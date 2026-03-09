import { Request, Response } from 'express';
import prisma from '../config/prisma';

// 
// LISTAR CATEGORIAS
// 

export async function listar(req: Request, res: Response) {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }
    });

    return res.json(categorias);

  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao listar categorias' });
  }
}

// 
// CRIAR CATEGORIA
// 

export async function criar(req: Request, res: Response) {
  try {
    const { nome } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: 'Nome é obrigatório!' });
    }

    const existe = await prisma.categoria.findUnique({
      where: { nome }
    });

    if (existe) {
      return res.status(400).json({ 
        erro: 'Já existe uma categoria com esse nome!' 
      });
    }

    const categoria = await prisma.categoria.create({
      data: { nome }
    });

    return res.status(201).json({
      mensagem: 'Categoria criada com sucesso!',
      categoria
    });

  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao criar categoria' });
  }
}

// 
// EDITAR CATEGORIA
// 

export async function editar(req: Request, res: Response) {
  try {
    //  "as string" → garante pro TypeScript que é uma string
    const id = req.params.id as string;
    const { nome } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: 'Nome é obrigatório!' });
    }

    const existe = await prisma.categoria.findUnique({
      where: { id }
    });

    if (!existe) {
      return res.status(404).json({ erro: 'Categoria não encontrada!' });
    }

    const categoriaAtualizada = await prisma.categoria.update({
      where: { id },
      data: { nome }
    });

    return res.json({
      mensagem: 'Categoria atualizada com sucesso!',
      categoria: categoriaAtualizada
    });

  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao editar categoria' });
  }
}

// 
// DESATIVAR CATEGORIA
// 

export async function desativar(req: Request, res: Response) {
  try {
    // "as string" → garante pro TypeScript que é uma string
    const id = req.params.id as string;

    const existe = await prisma.categoria.findUnique({
      where: { id }
    });

    if (!existe) {
      return res.status(404).json({ erro: 'Categoria não encontrada!' });
    }

    const temProdutos = await prisma.produto.findFirst({
      where: { 
        categoriaId: id,
        ativo: true 
      }
    });

    if (temProdutos) {
      return res.status(400).json({ 
        erro: 'Não é possível desativar! Existem produtos nessa categoria.' 
      });
    }

    await prisma.categoria.update({
      where: { id },
      data: { ativo: false }
    });

    return res.json({ mensagem: 'Categoria desativada com sucesso!' });

  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao desativar categoria' });
  }
}