import { Request, Response } from 'express';
import { ZodError } from 'zod';
import prisma from '../config/prisma';
import { criarAdicionalSchema, editarAdicionalSchema } from '../validators/adicionalSchemas';

// ─────────────────────────────────────────────────────────
// LISTAR ADICIONAIS — GET /api/adicionais
// ─────────────────────────────────────────────────────────
export async function listar(req: Request, res: Response) {
  try {
    const adicionais = await prisma.adicional.findMany({
      where: { ativo: true },
      include: {
        precoPorTamanho: { orderBy: { tamanho: 'asc' } },
      },
      orderBy: { nome: 'asc' },
    });

    return res.json(adicionais);
  } catch {
    return res.status(500).json({ erro: 'Erro ao listar adicionais' });
  }
}

// ─────────────────────────────────────────────────────────
// BUSCAR POR ID — GET /api/adicionais/:id
// ─────────────────────────────────────────────────────────
export async function buscarPorId(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const adicional = await prisma.adicional.findUnique({
      where: { id },
      include: {
        precoPorTamanho: { orderBy: { tamanho: 'asc' } },
      },
    });

    if (!adicional) {
      return res.status(404).json({ erro: 'Adicional não encontrado!' });
    }

    return res.json(adicional);
  } catch {
    return res.status(500).json({ erro: 'Erro ao buscar adicional' });
  }
}

// ─────────────────────────────────────────────────────────
// CRIAR ADICIONAL — POST /api/adicionais
// ─────────────────────────────────────────────────────────
export async function criar(req: Request, res: Response) {
  try {
    const { nome, preco, precoPorTamanho } = criarAdicionalSchema.parse(req.body);

    const adicional = await prisma.adicional.create({
      data: {
        nome,
        preco: Number(preco),
        ...(precoPorTamanho && precoPorTamanho.length > 0 && {
          precoPorTamanho: {
            create: precoPorTamanho.map((p) => ({
              tamanho: p.tamanho,
              preco: Number(p.preco),
            })),
          },
        }),
      },
      include: {
        precoPorTamanho: { orderBy: { tamanho: 'asc' } },
      },
    });

    return res.status(201).json({
      mensagem: 'Adicional criado com sucesso!',
      adicional,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ erro: error.issues[0].message });
    }

    return res.status(500).json({ erro: 'Erro ao criar adicional' });
  }
}

// ─────────────────────────────────────────────────────────
// EDITAR ADICIONAL — PUT /api/adicionais/:id
// ─────────────────────────────────────────────────────────
export async function editar(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { nome, preco, precoPorTamanho } = editarAdicionalSchema.parse(req.body);

    const existe = await prisma.adicional.findUnique({ where: { id } });
    if (!existe) {
      return res.status(404).json({ erro: 'Adicional não encontrado!' });
    }

    const adicionalAtualizado = await prisma.adicional.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(preco !== undefined && { preco: Number(preco) }),
        ...(precoPorTamanho && precoPorTamanho.length > 0 && {
          precoPorTamanho: {
            deleteMany: {},
            create: precoPorTamanho.map((p) => ({
              tamanho: p.tamanho,
              preco: Number(p.preco),
            })),
          },
        }),
      },
      include: {
        precoPorTamanho: { orderBy: { tamanho: 'asc' } },
      },
    });

    return res.json({
      mensagem: 'Adicional atualizado com sucesso!',
      adicional: adicionalAtualizado,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ erro: error.issues[0].message });
    }

    return res.status(500).json({ erro: 'Erro ao editar adicional' });
  }
}

// ─────────────────────────────────────────────────────────
// DESATIVAR ADICIONAL — DELETE /api/adicionais/:id
// ─────────────────────────────────────────────────────────
export async function desativar(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const existe = await prisma.adicional.findUnique({ where: { id } });
    if (!existe) {
      return res.status(404).json({ erro: 'Adicional não encontrado!' });
    }

    await prisma.adicional.update({
      where: { id },
      data: { ativo: false },
    });

    return res.json({ mensagem: 'Adicional desativado com sucesso!' });
  } catch {
    return res.status(500).json({ erro: 'Erro ao desativar adicional' });
  }
}