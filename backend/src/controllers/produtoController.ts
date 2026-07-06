import { Request, Response } from 'express';
import { Prisma, Tamanho, TipoProduto } from '@prisma/client';
import { ZodError } from 'zod';
import prisma from '../config/prisma';
import { criarProdutoSchema, editarProdutoSchema, parsePreco } from '../validators/produtoSchemas';

// Evita repetir o mesmo include gigante em 4 handlers diferentes
const produtoInclude = {
  categoria: { select: { id: true, nome: true } },
  tamanhos: { orderBy: { tamanho: 'asc' as const } },
  adicionaisProduto: {
    include: {
      adicional: {
        include: {
          precoPorTamanho: { orderBy: { tamanho: 'asc' as const } },
        },
      },
    },
  },
} satisfies Prisma.ProdutoInclude;

export async function listar(req: Request, res: Response) {
  try {
    const { categoriaId, apenasDisponiveis } = req.query;

    const where: Prisma.ProdutoWhereInput = { ativo: true };

    if (apenasDisponiveis === 'true') {
      where.disponivel = true;
    }

    if (typeof categoriaId === 'string') {
      where.categoriaId = categoriaId;
    }

    const produtos = await prisma.produto.findMany({
      where,
      include: produtoInclude,
      orderBy: [
        { disponivel: 'desc' },
        { nome: 'asc' },
      ],
    });

    return res.json(produtos);
  } catch (error) {
    console.error('[produto.listar]', error);
    return res.status(500).json({ erro: 'Erro ao listar produtos' });
  }
}

export async function buscarPorId(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const produto = await prisma.produto.findUnique({
      where: { id },
      include: produtoInclude,
    });

    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado!' });
    }

    return res.json(produto);
  } catch (error) {
    console.error('[produto.buscarPorId]', error);
    return res.status(500).json({ erro: 'Erro ao buscar produto' });
  }
}

export async function criar(req: Request, res: Response) {
  try {
    const {
      nome,
      descricao,
      emoji,
      preco,
      categoriaId,
      disponivel,
      tipo,
      tamanhos,
      adicionaisIds,
    } = criarProdutoSchema.parse(req.body);

    const categoriaExiste = await prisma.categoria.findUnique({
      where: { id: categoriaId as string },
    });

    if (!categoriaExiste) {
      return res.status(400).json({ erro: 'Categoria não encontrada!' });
    }

    const data: Prisma.ProdutoCreateInput = {
      nome: nome as string,
      descricao: descricao ?? null,
      emoji: emoji ?? null,
      preco: parsePreco(preco) ?? 0,
      categoria: {
        connect: { id: categoriaId as string },
      },
      disponivel: disponivel ?? true,
      tipo: tipo as TipoProduto,
      ...(tamanhos && tamanhos.length > 0
        ? {
            tamanhos: {
              create: tamanhos.map((t) => ({
                tamanho: t.tamanho as Tamanho,
                preco: parsePreco(t.preco) ?? 0,
              })),
            },
          }
        : {}),
      ...(adicionaisIds && adicionaisIds.length > 0
        ? {
            adicionaisProduto: {
              create: adicionaisIds.map((adicionalId) => ({
                adicional: {
                  connect: { id: adicionalId },
                },
              })),
            },
          }
        : {}),
    };

    const produto = await prisma.produto.create({
      data,
      include: produtoInclude,
    });

    return res.status(201).json({ mensagem: 'Produto criado com sucesso!', produto });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ erro: error.issues[0].message });
    }

    console.error('[produto.criar]', error);
    return res.status(500).json({ erro: 'Erro ao criar produto' });
  }
}

export async function editar(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const {
      nome,
      descricao,
      emoji,
      preco,
      categoriaId,
      disponivel,
      tamanhos,
      adicionaisIds,
    } = editarProdutoSchema.parse(req.body);

    const existe = await prisma.produto.findUnique({ where: { id } });

    if (!existe) {
      return res.status(404).json({ erro: 'Produto não encontrado!' });
    }

    if (categoriaId) {
      const categoriaExiste = await prisma.categoria.findUnique({
        where: { id: categoriaId },
      });

      if (!categoriaExiste) {
        return res.status(400).json({ erro: 'Categoria não encontrada!' });
      }
    }

    const data: Prisma.ProdutoUpdateInput = {
      ...(nome !== undefined ? { nome } : {}),
      ...(descricao !== undefined ? { descricao } : {}),
      ...(emoji !== undefined ? { emoji } : {}),
      ...(preco !== undefined ? { preco: parsePreco(preco) ?? 0 } : {}),
      ...(categoriaId !== undefined
        ? {
            categoria: {
              connect: { id: categoriaId },
            },
          }
        : {}),
      ...(disponivel !== undefined ? { disponivel } : {}),
      // Nota: se "tamanhos" vier como array vazio [], isso NÃO limpa os tamanhos
      // existentes (fica do jeito que estava). Se quiser permitir limpar tudo,
      // troque a condição por `tamanhos !== undefined`.
      ...(tamanhos && tamanhos.length > 0
        ? {
            tamanhos: {
              deleteMany: {},
              create: tamanhos.map((t) => ({
                tamanho: t.tamanho as Tamanho,
                preco: parsePreco(t.preco) ?? 0,
              })),
            },
          }
        : {}),
      ...(adicionaisIds
        ? {
            adicionaisProduto: {
              deleteMany: {},
              create: adicionaisIds.map((adicionalId) => ({
                adicional: {
                  connect: { id: adicionalId },
                },
              })),
            },
          }
        : {}),
    };

    const produtoAtualizado = await prisma.produto.update({
      where: { id },
      data,
      include: produtoInclude,
    });

    return res.json({ mensagem: 'Produto atualizado com sucesso!', produto: produtoAtualizado });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ erro: error.issues[0].message });
    }

    console.error('[produto.editar]', error);
    return res.status(500).json({ erro: 'Erro ao editar produto' });
  }
}

export async function alternarDisponibilidade(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const produto = await prisma.produto.findUnique({ where: { id } });

    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado!' });
    }

    if (!produto.ativo) {
      return res.status(400).json({ erro: 'Produto inativo não pode ter disponibilidade alterada!' });
    }

    const produtoAtualizado = await prisma.produto.update({
      where: { id },
      data: { disponivel: !produto.disponivel },
      select: { id: true, nome: true, disponivel: true },
    });

    return res.json({
      mensagem: produtoAtualizado.disponivel
        ? `${produtoAtualizado.nome} está DISPONÍVEL!`
        : `${produtoAtualizado.nome} está INDISPONÍVEL!`,
      produto: produtoAtualizado,
    });
  } catch (error) {
    console.error('[produto.alternarDisponibilidade]', error);
    return res.status(500).json({ erro: 'Erro ao alterar disponibilidade' });
  }
}

export async function desativar(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const existe = await prisma.produto.findUnique({ where: { id } });

    if (!existe) {
      return res.status(404).json({ erro: 'Produto não encontrado!' });
    }

    await prisma.produto.update({
      where: { id },
      data: { ativo: false },
    });

    return res.json({ mensagem: 'Produto desativado com sucesso!' });
  } catch (error) {
    console.error('[produto.desativar]', error);
    return res.status(500).json({ erro: 'Erro ao desativar produto' });
  }
}