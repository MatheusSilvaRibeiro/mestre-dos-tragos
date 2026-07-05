import { Request, Response } from 'express';
import prisma from '../config/prisma';

// ─────────────────────────────────────────────────────────
// LISTAR ADICIONAIS — GET /api/adicionais
// Retorna todos os adicionais ativos com seus preços por tamanho
// ─────────────────────────────────────────────────────────
export async function listar(req: Request, res: Response) {
  try {
    const adicionais = await prisma.adicional.findMany({
      where: { ativo: true },
      include: {
        // Inclui os preços por tamanho (P, M, G) ordenados
        precoPorTamanho: { orderBy: { tamanho: 'asc' } },
      },
      orderBy: { nome: 'asc' },
    });

    return res.json(adicionais);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao listar adicionais' });
  }
}

// ─────────────────────────────────────────────────────────
// BUSCAR POR ID — GET /api/adicionais/:id
// Busca um adicional específico pelo ID
// ─────────────────────────────────────────────────────────
export async function buscarPorId(req: Request, res: Response) {
  try {
    // Cast explícito para string — o Prisma exige string pura no where
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
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar adicional' });
  }
}

// ─────────────────────────────────────────────────────────
// CRIAR ADICIONAL — POST /api/adicionais
// Só ADMIN pode criar. Suporta preço fixo ou preço por tamanho.
//
// Exemplo preço fixo (lanches):
// { "nome": "Bacon", "preco": 5.00 }
//
// Exemplo preço por tamanho (batata frita):
// { "nome": "Bacon", "preco": 5.00, "precoPorTamanho": [
//   { "tamanho": "P", "preco": 5.00 },
//   { "tamanho": "M", "preco": 8.00 },
//   { "tamanho": "G", "preco": 10.00 }
// ]}
// ─────────────────────────────────────────────────────────
export async function criar(req: Request, res: Response) {
  try {
    const { nome, preco, precoPorTamanho } = req.body;

    // Valida os campos obrigatórios antes de qualquer coisa
    if (!nome || preco === undefined) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, preco' });
    }

    const adicional = await prisma.adicional.create({
      data: {
        nome,
        preco: Number(preco),
        // Se vieram preços por tamanho, já cria tudo junto numa única operação
        ...(precoPorTamanho && precoPorTamanho.length > 0 && {
          precoPorTamanho: {
            create: precoPorTamanho.map((p: any) => ({
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
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao criar adicional' });
  }
}

// ─────────────────────────────────────────────────────────
// EDITAR ADICIONAL — PUT /api/adicionais/:id
// Só ADMIN pode editar. Todos os campos são opcionais.
// Se enviar precoPorTamanho, os antigos são apagados e substituídos.
// ─────────────────────────────────────────────────────────
export async function editar(req: Request, res: Response) {
  try {
    // Cast explícito para string — o Prisma exige string pura no where
    const id = req.params.id as string;
    const { nome, preco, precoPorTamanho } = req.body;

    // Verifica se o adicional existe antes de tentar editar
    const existe = await prisma.adicional.findUnique({ where: { id } });
    if (!existe) {
      return res.status(404).json({ erro: 'Adicional não encontrado!' });
    }

    const adicionalAtualizado = await prisma.adicional.update({
      where: { id },
      data: {
        // Só atualiza o que foi enviado — campos ausentes ficam intactos
        ...(nome && { nome }),
        ...(preco !== undefined && { preco: Number(preco) }),
        // Estratégia deleteMany + create: apaga os preços antigos e cria os novos
        ...(precoPorTamanho && precoPorTamanho.length > 0 && {
          precoPorTamanho: {
            deleteMany: {},
            create: precoPorTamanho.map((p: any) => ({
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
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao editar adicional' });
  }
}

// ─────────────────────────────────────────────────────────
// DESATIVAR ADICIONAL — DELETE /api/adicionais/:id
// Não deleta do banco — apenas marca como inativo.
// Isso preserva o histórico de pedidos que usaram esse adicional.
// ─────────────────────────────────────────────────────────
export async function desativar(req: Request, res: Response) {
  try {
    // Cast explícito para string — o Prisma exige string pura no where
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
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao desativar adicional' });
  }
}